import { z } from "zod";

import { err, ok, Result } from "@/lib";

import { loadAccountByHandle } from "@/identity/entities";
import {
  Amount,
  getStablecoinTokenAddress,
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
  PaymentMetadata,
} from "@/payments/values";
import {
  BlockchainPaymentActionError,
  PaymentInsufficientBalanceError,
  PaymentInvalidAccountError,
  PaymentUnsupportedTokenError,
} from "@/payments/errors";

import { transactViaCrypto } from "./transact-via-crypto";
import { PayOutcome, PayTrigger } from "./pay";

export const PayToArcPayDTO = z.object({
  amount: Amount,
  currency: StablecoinToken,
  method: PaymentMethodTypeArcPay,
  arc_pay: PaymentMethodArcPay,
  metadata: PaymentMetadata.optional(),
});

export const payToArcPay = async ({
  live,
  trigger,
  dto,
}: {
  live: boolean;
  trigger: PayTrigger;
  dto: z.infer<typeof PayToArcPayDTO>;
}): Promise<
  Result<
    PayOutcome,
    | BlockchainWalletActionError
    | BlockchainPaymentActionError
    | UnsupportedBlockchainError
    | PaymentUnsupportedTokenError
    | PaymentInvalidAccountError
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

  if (receiverAccount.id === trigger.senderAccountId) {
    return err({
      type: "PaymentInvalidAccountError",
      invalidReason: "self",
      handle: dto.arc_pay.account,
    });
  }

  // Check if the sender has enough balance for the currency in a single location
  const senderBalanceCheckResult = await hasBalanceInSingleLocation({
    accountId: trigger.senderAccountId,
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

  // Execute the crypto payment
  const transactViaCryptoResult = await transactViaCrypto({
    live,
    sender: {
      accountId: trigger.senderAccountId,
      locationId: senderBalanceCheckResult.value.location.id,
      blockchain: senderBalanceCheckResult.value.location.blockchain,
      address: senderBalanceCheckResult.value.location.address,
    },
    receiver: {
      hasArcPay: true,
      accountId: receiverAccount.id,
      locationId: receiverLocationResult.value.id,
      blockchain: receiverLocationResult.value.blockchain,
      address: receiverLocationResult.value.address,
    },
    payment: {
      amount: dto.amount,
      currency: dto.currency,
      tokenAddress,
      method: dto.method,
      arc_pay: dto.arc_pay,
      metadata: dto.metadata,
    },
    trigger,
  });

  if (!transactViaCryptoResult.ok) return transactViaCryptoResult;

  return ok(transactViaCryptoResult.value);
};
