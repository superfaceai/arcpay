import { z } from "zod";

import { err, ok, Result } from "@/lib";

import { Amount, Currency } from "@/balances/values";
import { loadLocationById, Location } from "@/balances/entities";
import { hasBalanceInSingleLocation } from "@/balances/services";
import { BlockchainWalletActionError } from "@/balances/errors";

import {
  BlockchainBridgeError,
  BridgeTransferLocationError,
  BridgeTransferCurrencyError,
  PaymentInsufficientBalanceError,
} from "@/payments/errors";
import { BridgeTransfer, Transaction } from "@/payments/entities";

import { BridgeUSDCBetweenBlockchains } from "@/payments/interfaces";
import { bridgeUSDCBetweenBlockchains } from "@/circle/adapters";
import { saveBridgeTransferWithTransactions } from "../repositories";

export const BridgeAmountDTO = z.object({
  amount: Amount,
  currency: Currency,
  from_location: Location.shape.id,
  to_location: Location.shape.id,
});

export type BridgeAmountOutcome = {
  bridge: BridgeTransfer;
  transactions: Transaction[];
};

export const bridgeAmount = async ({
  accountId,
  live,
  dto,
  bridgeUSDCBetweenBlockchainsAdapter = bridgeUSDCBetweenBlockchains,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof BridgeAmountDTO>;
  bridgeUSDCBetweenBlockchainsAdapter?: BridgeUSDCBetweenBlockchains;
}): Promise<
  Result<
    BridgeTransfer,
    | BlockchainBridgeError
    | BlockchainWalletActionError
    | BridgeTransferLocationError
    | BridgeTransferCurrencyError
    | PaymentInsufficientBalanceError
  >
> => {
  if (dto.currency !== "USDC")
    return err({
      type: "BridgeTransferCurrencyError",
      reason: "not_supported",
      currency: dto.currency,
    });

  const [fromLocation, toLocation] = await Promise.all([
    loadLocationById({
      locationId: dto.from_location,
      accountId,
      live,
    }),
    loadLocationById({
      locationId: dto.to_location,
      accountId,
      live,
    }),
  ]);

  if (!fromLocation)
    return err({
      type: "BridgeTransferLocationError",
      reason: "not_found",
      locationId: dto.from_location,
    });
  if (fromLocation.type !== "crypto_wallet")
    return err({
      type: "BridgeTransferLocationError",
      reason: "unsupported",
      locationId: dto.from_location,
    });

  if (!toLocation)
    return err({
      type: "BridgeTransferLocationError",
      reason: "not_found",
      locationId: dto.to_location,
    });
  if (toLocation.type !== "crypto_wallet")
    return err({
      type: "BridgeTransferLocationError",
      reason: "unsupported",
      locationId: dto.to_location,
    });

  const balanceCheckResult = await hasBalanceInSingleLocation({
    accountId,
    live,
    amount: dto.amount,
    currency: dto.currency,
    preferredBlockchain: fromLocation.blockchain,
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

  const bridgeUSDCBetweenBlockchainsResult =
    await bridgeUSDCBetweenBlockchainsAdapter({
      amount: dto.amount,
      from: {
        address: fromLocation.address,
        blockchain: fromLocation.blockchain,
        locationId: dto.from_location,
      },
      to: {
        address: toLocation.address,
        blockchain: toLocation.blockchain,
        locationId: dto.to_location,
      },
      accountId,
      live,
    });

  if (!bridgeUSDCBetweenBlockchainsResult.ok)
    return bridgeUSDCBetweenBlockchainsResult;

  const txs = [
    bridgeUSDCBetweenBlockchainsResult.value.approval?.fee,
    bridgeUSDCBetweenBlockchainsResult.value.burn?.fee,
    bridgeUSDCBetweenBlockchainsResult.value.burn?.tx,
    bridgeUSDCBetweenBlockchainsResult.value.mint?.fee,
    bridgeUSDCBetweenBlockchainsResult.value.mint?.tx,
  ].filter(Boolean) as Transaction[];

  await saveBridgeTransferWithTransactions(
    accountId,
    bridgeUSDCBetweenBlockchainsResult.value.bridge,
    txs
  );

  return ok(bridgeUSDCBetweenBlockchainsResult.value.bridge);
};
