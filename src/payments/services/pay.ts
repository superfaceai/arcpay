import Big from "big.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { err, ok, Result } from "@/lib";

import { getBalance } from "@/balances/services";
import { listLocations } from "@/balances/services";
import {
  Amount,
  getStablecoinTokenAddress,
  StablecoinToken,
} from "@/balances/values";
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
  PaymentInvalidAddressError,
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

const PayDTOBase = z.object({
  amount: Amount,
  currency: StablecoinToken,
});
const PayDTOMethodCrypto = PayDTOBase.extend({
  method: PaymentMethodTypeCrypto,
  crypto: PaymentMethodCrypto,
});

export const PayDTO = z.discriminatedUnion("method", [PayDTOMethodCrypto]);

export const pay = async ({
  accountId,
  live,
  dto,
  validateBlockchainAddressAdapter = validateBlockchainAddress,
  sendBlockchainTransactionAdapter = sendBlockchainTransaction,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof PayDTO>;
  validateBlockchainAddressAdapter?: ValidateBlockchainAddress;
  sendBlockchainTransactionAdapter?: SendBlockchainTransaction;
}): Promise<
  Result<
    Payment,
    | BlockchainPaymentActionError
    | BlockchainWalletActionError
    | PaymentInvalidAddressError
    | PaymentUnsupportedTokenError
    | PaymentInsufficientBalanceError
  >
> => {
  // Validate the payment method (when we support more methods)

  const validation = await validateBlockchainAddressAdapter({
    address: dto.crypto.address,
    blockchain: dto.crypto.blockchain,
    live,
  });

  if (!validation.ok) {
    return validation;
  } else if (!validation.value.isValid) {
    return err({
      type: "PaymentInvalidAddressError",
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

  // Check if the user has enough currency balance
  const balanceResult = await getBalance({
    accountId,
    live,
    currency: dto.currency,
  });

  if (!balanceResult.ok) return balanceResult;

  if (
    !balanceResult.value ||
    Big(balanceResult.value?.amount ?? "0").lt(Big(dto.amount).abs())
  ) {
    return err({
      type: "PaymentInsufficientBalanceError",
      currency: dto.currency,
      requiredAmount: dto.amount,
      availableAmount: balanceResult.value?.amount ?? "0",
    });
  }

  // Check if the balance is available in a single location
  const locationsResult = await listLocations({
    accountId,
    live,
    locationIds: balanceResult.value?.locations || [],
  });
  if (!locationsResult.ok) return locationsResult;

  const matchedLocation = locationsResult.value.find(
    (location) => location.blockchain === dto.crypto.blockchain
  );
  const matchedLocationAvailableAmount =
    matchedLocation?.assets.find((asset) => asset.currency === dto.currency)
      ?.amount ?? "0";

  if (
    !matchedLocation ||
    Big(matchedLocationAvailableAmount).lt(Big(dto.amount).abs())
  ) {
    return err({
      type: "PaymentInsufficientBalanceError",
      currency: dto.currency,
      requiredAmount: dto.amount,
      availableAmount: matchedLocationAvailableAmount,
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
    location: matchedLocation.id,
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
    sourceAddress: matchedLocation.address,
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
