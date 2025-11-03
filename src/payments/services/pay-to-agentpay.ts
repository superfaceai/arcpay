import { z } from "zod";

import { err, Result } from "@/lib";

import { loadAccountByHandle } from "@/identity/entities";
import { Amount, StablecoinToken } from "@/balances/values";
import {
  ensureLocation,
  hasBalanceInSingleLocation,
} from "@/balances/services";
import {
  BlockchainWalletActionError,
  UnsupportedBlockchainError,
} from "@/balances/errors";

import {
  PaymentMethodTypeAgentPay,
  PaymentMethodAgentPay,
} from "@/payments/values";
import {
  PaymentInsufficientBalanceError,
  PaymentInvalidAccountError,
  PaymentUnsupportedPaymentMethodError,
} from "@/payments/errors";
import { Payment } from "@/payments/entities";

export const PayToAgentPayDTO = z.object({
  amount: Amount,
  currency: StablecoinToken,
  method: PaymentMethodTypeAgentPay,
  agent_pay: PaymentMethodAgentPay,
});

export const payToAgentPay = async ({
  accountId,
  live,
  dto,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof PayToAgentPayDTO>;
}): Promise<
  Result<
    Payment,
    | BlockchainWalletActionError
    | UnsupportedBlockchainError
    | PaymentInvalidAccountError
    | PaymentUnsupportedPaymentMethodError
    | PaymentInsufficientBalanceError
  >
> => {
  const receiverAccount = await loadAccountByHandle(dto.agent_pay.account);

  if (!receiverAccount) {
    return err({
      type: "PaymentInvalidAccountError",
      invalidReason: "not_found",
      handle: dto.agent_pay.account,
    });
  }

  if (receiverAccount.id === accountId) {
    return err({
      type: "PaymentInvalidAccountError",
      invalidReason: "self",
      handle: dto.agent_pay.account,
    });
  }

  // Check if the sender has enough balance for the currency in a single location
  const senderBalanceCheckResult = await hasBalanceInSingleLocation({
    accountId,
    live,
    amount: dto.amount,
    currency: dto.currency,
    preferredBlockchain: undefined, // no preferred blockchain for Agent Pay
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

  return err({
    type: "PaymentUnsupportedPaymentMethodError",
    method: dto.method,
  });
};
