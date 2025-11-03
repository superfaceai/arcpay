import Big from "big.js";
import { ok, Result } from "@/lib";

import { Amount, Blockchain, Currency } from "@/balances/values";
import { BlockchainWalletActionError } from "@/balances/errors";
import { Location } from "@/balances/entities";

import { getBalance } from "./get-balance";
import { listLocations } from "./list-locations";

export type BalanceCheckResult =
  | {
      hasBalance: false;
      availableAmount: Amount;
    }
  | {
      hasBalance: true;
      inSingleLocation: false;
      availableAmount: Amount;
      locations: Location[];
    }
  | {
      hasBalance: true;
      inSingleLocation: true;
      inPreferredBlockchain: boolean;
      availableAmount: Amount;
      location: Location;
    };

export const hasBalanceInSingleLocation = async ({
  accountId,
  live,
  amount,
  currency,
  preferredBlockchain,
}: {
  accountId: string;
  live: boolean;
  amount: Amount;
  currency: Currency;
  preferredBlockchain?: Blockchain;
}): Promise<Result<BalanceCheckResult, BlockchainWalletActionError>> => {
  const balanceResult = await getBalance({
    accountId,
    live,
    currency,
  });

  if (!balanceResult.ok) return balanceResult;

  if (
    !balanceResult.value ||
    Big(balanceResult.value?.amount ?? "0").lt(Big(amount).abs())
  ) {
    return ok({
      hasBalance: false,
      availableAmount: balanceResult.value?.amount ?? "0",
    });
  }

  // Has balance, check if it's in a single location
  const locationsResult = await listLocations({
    accountId,
    live,
    locationIds: balanceResult.value?.locations || [],
  });
  if (!locationsResult.ok) return locationsResult;

  const locationsWithEntireBalance = locationsResult.value.filter((location) =>
    hasBalanceInLocation({ location, amount, currency })
  );

  if (locationsWithEntireBalance.length === 0) {
    // Has balance, but not in a single location
    const locationsWithCurrency = locationsResult.value.filter((location) =>
      location.assets.some((asset) => asset.currency === currency)
    );

    const availableAmount = locationsWithCurrency.reduce((acc, location) => {
      return acc.plus(
        Big(
          location.assets.find((asset) => asset.currency === currency)
            ?.amount ?? "0"
        )
      );
    }, Big(0));

    return ok({
      hasBalance: true,
      inSingleLocation: false,
      availableAmount: availableAmount.toString(),
      locations: locationsWithCurrency,
    });
  }

  let inPreferredBlockchain = false;
  let location: Location | undefined;

  if (preferredBlockchain) {
    location = locationsWithEntireBalance.find(
      (location) => location.blockchain === preferredBlockchain
    );
    if (location) {
      inPreferredBlockchain = true;
    } else {
      location = locationsWithEntireBalance[0];
    }
  } else {
    location = locationsWithEntireBalance[0];
  }

  return ok({
    hasBalance: true,
    inSingleLocation: true,
    inPreferredBlockchain: inPreferredBlockchain,
    availableAmount:
      location?.assets.find((asset) => asset.currency === currency)?.amount ??
      "0",
    location: location,
  });
};

const hasBalanceInLocation = ({
  location,
  amount,
  currency,
}: {
  location: Location;
  amount: Amount;
  currency: Currency;
}): boolean => {
  return Big(
    location.assets.find((asset) => asset.currency === currency)?.amount ?? "0"
  ).gte(Big(amount).abs());
};
