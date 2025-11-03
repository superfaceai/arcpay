import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { err, ok, Result } from "@/lib";

import {
  Amount,
  getStablecoinTokenAddress,
  StablecoinToken,
} from "@/balances/values";
import { hasBalanceInSingleLocation } from "@/balances/services";
import { BlockchainWalletActionError } from "@/balances/errors";

import {
  Payment,
  transactionId,
  PaymentTransaction,
  paymentId,
  savePaymentWithTransactions,
  saveManyTransactions,
} from "@/payments/entities";
import {
  PaymentMethodCrypto,
  PaymentMethodTypeCrypto,
} from "@/payments/values";
import {
  PaymentInsufficientBalanceError,
  PaymentUnsupportedTokenError,
  PaymentInvalidCryptoAddressError,
  BlockchainPaymentActionError,
} from "@/payments/errors";

import {
  SendBlockchainTransaction,
  ValidateBlockchainAddress,
} from "@/payments/interfaces";
import {
  sendBlockchainTransaction,
  validateBlockchainAddress,
} from "@/circle/adapters";

export const PayToCryptoDTO = z.object({
  amount: Amount,
  currency: StablecoinToken,
  method: PaymentMethodTypeCrypto,
  crypto: PaymentMethodCrypto,
});

export const payToCrypto = async ({
  accountId,
  live,
  dto,
  validateBlockchainAddressAdapter = validateBlockchainAddress,
  sendBlockchainTransactionAdapter = sendBlockchainTransaction,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof PayToCryptoDTO>;
  validateBlockchainAddressAdapter?: ValidateBlockchainAddress;
  sendBlockchainTransactionAdapter?: SendBlockchainTransaction;
}): Promise<
  Result<
    Payment,
    | BlockchainPaymentActionError
    | BlockchainWalletActionError
    | PaymentInvalidCryptoAddressError
    | PaymentUnsupportedTokenError
    | PaymentInsufficientBalanceError
  >
> => {
  const validation = await validateBlockchainAddressAdapter({
    address: dto.crypto.address,
    blockchain: dto.crypto.blockchain,
    live,
  });

  if (!validation.ok) {
    return validation;
  } else if (!validation.value.isValid) {
    return err({
      type: "PaymentInvalidCryptoAddressError",
      address: dto.crypto.address,
      blockchain: dto.crypto.blockchain,
    });
  }

  const tokenAddress = getStablecoinTokenAddress({
    blockchain: dto.crypto.blockchain,
    token: dto.currency,
    live,
  });

  if (!tokenAddress) {
    return err({
      type: "PaymentUnsupportedTokenError",
      token: dto.currency,
      blockchain: dto.crypto.blockchain,
    });
  }

  const balanceCheckResult = await hasBalanceInSingleLocation({
    accountId,
    live,
    amount: dto.amount,
    currency: dto.currency,
    preferredBlockchain: dto.crypto.blockchain,
  });

  if (!balanceCheckResult.ok) return balanceCheckResult;

  const hasBalance = balanceCheckResult.value.hasBalance;
  const hasBalanceInsideSingleLocation =
    balanceCheckResult.value.hasBalance &&
    balanceCheckResult.value.inSingleLocation;
  const hasBalanceInPreferredBlockchain =
    balanceCheckResult.value.hasBalance &&
    balanceCheckResult.value.inSingleLocation &&
    balanceCheckResult.value.inPreferredBlockchain;

  if (
    !hasBalance ||
    !hasBalanceInsideSingleLocation ||
    !hasBalanceInPreferredBlockchain
  ) {
    return err({
      type: "PaymentInsufficientBalanceError",
      currency: dto.currency,
      requiredAmount: dto.amount,
      availableAmount: balanceCheckResult.value.availableAmount,
      reason: !hasBalance
        ? "no_balance"
        : !hasBalanceInsideSingleLocation
        ? "not_in_single_location"
        : "not_in_preferred_network",
    });
  }

  // TODO: Estimate fees

  // Start transaction
  const payment: Payment = {
    id: paymentId(),
    amount: dto.amount,
    currency: dto.currency,
    method: dto.method,
    crypto: dto.method === "crypto" ? dto.crypto : undefined,
    fees: [],
    status: "pending",
    live,
    created_at: new Date(),
  };

  const newTransaction: PaymentTransaction = {
    id: transactionId(),
    status: "queued",
    live,
    amount: dto.amount,
    currency: dto.currency,
    type: "payment",
    network: "blockchain",
    location: balanceCheckResult.value.location.id,
    blockchain: {
      hash: "n/a",
      counterparty: dto.crypto.address,
    },
    payment: payment.id,
    created_at: new Date(),
    fingerprint: uuidv4(),
  };

  await savePaymentWithTransactions({
    payment,
    transactions: [newTransaction],
    accountId,
  });

  const sentTransactionResult = await sendBlockchainTransactionAdapter({
    transaction: newTransaction,
    sourceAddress: balanceCheckResult.value.location.address,
    destinationAddress: dto.crypto.address,
    tokenAddress,
    blockchain: dto.crypto.blockchain,
    live,
  });

  if (!sentTransactionResult.ok) return sentTransactionResult;

  const { payment: sentPaymentTx, fee: sentFeeTx } =
    sentTransactionResult.value;

  const feeTransaction = sentFeeTx
    ? {
        id: transactionId(),
        live,
        payment: payment.id,
        ...sentFeeTx,
      }
    : undefined;

  await saveManyTransactions({
    transactions: [sentPaymentTx, ...(feeTransaction ? [feeTransaction] : [])],
    accountId,
  });

  return ok(payment);
};
