import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { err, ok, Result } from "@/lib";

import { loadAccountByHandle, loadAccountById } from "@/identity/entities";
import {
  Amount,
  getStablecoinTokenAddress,
  mapAmount,
  StablecoinToken,
} from "@/balances/values";
import {
  ensureLocation,
  hasBalanceInSingleLocation,
} from "@/balances/services";
import {
  BlockchainWalletActionError,
  UnsupportedBlockchainError,
} from "@/balances/errors";

import {
  PaymentMethodTypeArcPay,
  PaymentMethodArcPay,
} from "@/payments/values";
import {
  BlockchainPaymentActionError,
  PaymentInsufficientBalanceError,
  PaymentInvalidAccountError,
  PaymentUnsupportedPaymentMethodError,
  PaymentUnsupportedTokenError,
} from "@/payments/errors";
import {
  Payment,
  PaymentCapture,
  paymentCaptureId,
  paymentId,
  PaymentTransaction,
  transactionId,
} from "@/payments/entities";
import { savePaymentsWithTransactionsAndCaptures } from "@/payments/repositories";

import { SendBlockchainTransaction } from "@/payments/interfaces";
import { sendBlockchainTransaction } from "@/circle/adapters";

export const PayToArcPayDTO = z.object({
  amount: Amount,
  currency: StablecoinToken,
  method: PaymentMethodTypeArcPay,
  arc_pay: PaymentMethodArcPay,
});

export const payToArcPay = async ({
  accountId,
  live,
  dto,
  sendBlockchainTransactionAdapter = sendBlockchainTransaction,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof PayToArcPayDTO>;
  sendBlockchainTransactionAdapter?: SendBlockchainTransaction;
}): Promise<
  Result<
    Payment,
    | BlockchainWalletActionError
    | BlockchainPaymentActionError
    | UnsupportedBlockchainError
    | PaymentUnsupportedTokenError
    | PaymentInvalidAccountError
    | PaymentUnsupportedPaymentMethodError
    | PaymentInsufficientBalanceError
  >
> => {
  const receiverAccount = await loadAccountByHandle(dto.arc_pay.account);

  if (!receiverAccount) {
    return err({
      type: "PaymentInvalidAccountError",
      invalidReason: "not_found",
      handle: dto.arc_pay.account,
    });
  }

  if (receiverAccount.id === accountId) {
    return err({
      type: "PaymentInvalidAccountError",
      invalidReason: "self",
      handle: dto.arc_pay.account,
    });
  }

  // Check if the sender has enough balance for the currency in a single location
  const senderBalanceCheckResult = await hasBalanceInSingleLocation({
    accountId,
    live,
    amount: dto.amount,
    currency: dto.currency,
    preferredBlockchain: undefined, // no preferred blockchain for Arc Pay
  });
  if (!senderBalanceCheckResult.ok) return senderBalanceCheckResult;

  const hasBalance = senderBalanceCheckResult.value.hasBalance;
  const hasBalanceInsideSingleLocation =
    senderBalanceCheckResult.value.hasBalance &&
    senderBalanceCheckResult.value.inSingleLocation;

  if (!hasBalance || !hasBalanceInsideSingleLocation) {
    return err({
      type: "PaymentInsufficientBalanceError",
      currency: dto.currency,
      requiredAmount: dto.amount,
      availableAmount: senderBalanceCheckResult.value.availableAmount,
      reason: !hasBalance ? "no_balance" : "not_in_single_location",
    });
  }

  const tokenAddress = getStablecoinTokenAddress({
    blockchain: senderBalanceCheckResult.value.location.blockchain,
    token: dto.currency,
    live,
  });

  if (!tokenAddress) {
    return err({
      type: "PaymentUnsupportedTokenError",
      token: dto.currency,
      blockchain: senderBalanceCheckResult.value.location.blockchain,
    });
  }

  // Ensure the receiver has location matching the sender's location
  const receiverLocationResult = await ensureLocation({
    accountId: receiverAccount.id,
    live,
    currency: dto.currency,
    preferredBlockchains: [senderBalanceCheckResult.value.location.blockchain],
  });
  if (!receiverLocationResult.ok) return receiverLocationResult;

  // TODO: Execute the crypto payment
  console.debug("TODO: Execute the crypto payment", {
    from: {
      account: accountId,
      location: senderBalanceCheckResult.value.location.id,
      blockchain: senderBalanceCheckResult.value.location.blockchain,
      address: senderBalanceCheckResult.value.location.address,
    },
    to: {
      account: receiverAccount.id,
      location: receiverLocationResult.value.id,
      blockchain: receiverLocationResult.value.blockchain,
      address: receiverLocationResult.value.address,
    },
  });

  const senderPayment: Payment = {
    id: paymentId(),
    amount: mapAmount(dto.amount, { negative: false }),
    currency: dto.currency,
    method: dto.method,
    arc_pay: dto.method === "arc_pay" ? dto.arc_pay : undefined,
    fees: [],
    status: "pending",
    trigger: { method: "user" },
    authorization: { method: "user" },
    live,
    created_at: new Date(),
  };
  const receiverPaymentCapture: PaymentCapture = {
    id: paymentCaptureId(),
    amount: mapAmount(dto.amount, { negative: false }),
    currency: dto.currency,
    method: dto.method,
    status: "requires_capture",
    authorization: { method: "sender" },
    live,
    created_at: new Date(),
  };
  const senderTransaction: PaymentTransaction = {
    id: transactionId(),
    status: "queued",
    live,
    amount: mapAmount(dto.amount, { negative: true }),
    currency: dto.currency,
    type: "payment",
    network: "blockchain",
    location: senderBalanceCheckResult.value.location.id,
    blockchain: {
      hash: "n/a",
      counterparty: receiverLocationResult.value.address,
    },
    payment: senderPayment.id,
    created_at: new Date(),
    fingerprint: uuidv4(),
  };

  await savePaymentsWithTransactionsAndCaptures([
    {
      accountId,
      payments: [senderPayment],
      transactions: [senderTransaction],
      paymentCaptures: [],
    },
    {
      accountId: receiverAccount.id,
      payments: [],
      transactions: [],
      paymentCaptures: [receiverPaymentCapture],
    },
  ]);

  const sentTransactionResult = await sendBlockchainTransactionAdapter({
    transaction: senderTransaction,
    sourceAddress: senderBalanceCheckResult.value.location.address,
    destinationAddress: receiverLocationResult.value.address,
    tokenAddress,
    blockchain: senderBalanceCheckResult.value.location.blockchain,
    live,
  });

  if (!sentTransactionResult.ok) return sentTransactionResult;

  const { payment: senderPaymentTx, fee: senderFeeTx } =
    sentTransactionResult.value;

  const senderFeeTransaction = senderFeeTx
    ? {
        id: transactionId(),
        live,
        payment: senderPayment.id,
        ...senderFeeTx,
      }
    : undefined;

  const receiverTransaction: PaymentTransaction = {
    id: transactionId(),
    status: "queued",
    live,
    amount: mapAmount(dto.amount, { negative: false }),
    currency: dto.currency,
    type: "payment",
    network: "blockchain",
    location: receiverLocationResult.value.id,
    blockchain: {
      hash: senderPaymentTx.blockchain.hash, // key to match the on-chain tx
      counterparty: senderBalanceCheckResult.value.location.address,
    },
    capture: receiverPaymentCapture.id,
    created_at: new Date(),
  };
  const receiverCaptureProcessing: PaymentCapture = {
    ...receiverPaymentCapture,
    status: "processing",
  };

  await savePaymentsWithTransactionsAndCaptures([
    {
      accountId,
      payments: [],
      transactions: [
        senderPaymentTx,
        ...(senderFeeTransaction ? [senderFeeTransaction] : []),
      ],
      paymentCaptures: [],
    },
    {
      accountId: receiverAccount.id,
      payments: [],
      transactions: [receiverTransaction],
      paymentCaptures: [receiverCaptureProcessing],
    },
  ]);

  return ok(senderPayment);
};
