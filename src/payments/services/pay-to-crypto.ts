import { z } from "zod";

import { err, ok, Result } from "@/lib";

import {
  Amount,
  getStablecoinTokenAddress,
  StablecoinToken,
} from "@/balances/values";
import { hasBalanceInSingleLocation } from "@/balances/services";
import { BlockchainWalletActionError } from "@/balances/errors";

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

import { ValidateBlockchainAddress } from "@/payments/interfaces";
import { validateBlockchainAddress } from "@/circle/adapters";
import { transactViaCrypto } from "./transact-via-crypto";
import { PayOutcome, PayTrigger } from "./pay";

export const PayToCryptoDTO = z.object({
  amount: Amount,
  currency: StablecoinToken,
  method: PaymentMethodTypeCrypto,
  crypto: PaymentMethodCrypto,
});

export const payToCrypto = async ({
  live,
  trigger,
  dto,
  validateBlockchainAddressAdapter = validateBlockchainAddress,
}: {
  live: boolean;
  trigger: PayTrigger;
  dto: z.infer<typeof PayToCryptoDTO>;
  validateBlockchainAddressAdapter?: ValidateBlockchainAddress;
}): Promise<
  Result<
    PayOutcome,
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
    accountId: trigger.senderAccountId,
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
  const transactViaCryptoResult = await transactViaCrypto({
    live,
    sender: {
      accountId: trigger.senderAccountId,
      locationId: balanceCheckResult.value.location.id,
      blockchain: balanceCheckResult.value.location.blockchain,
      address: balanceCheckResult.value.location.address,
    },
    receiver: {
      hasArcPay: false,
      blockchain: dto.crypto.blockchain,
      address: dto.crypto.address,
    },
    payment: {
      amount: dto.amount,
      currency: dto.currency,
      tokenAddress,
      method: dto.method,
      crypto: dto.crypto,
    },
    trigger,
  });

  if (!transactViaCryptoResult.ok) return transactViaCryptoResult;

  return ok(transactViaCryptoResult.value);
};
