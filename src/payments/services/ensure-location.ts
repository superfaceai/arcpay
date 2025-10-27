import { err, ok, Result } from "@/lib";

import { Location, loadManyLocationsById } from "@/payments/entities";
import { Blockchain, Currency, isCurrencySupported } from "@/payments/values";

import {
  BlockchainActionError,
  UnsupportedBlockchainError,
} from "@/payments/errors.js";

import { getBalance } from "./get-balance";
import { createLocation } from "./create-location";

export const ensureLocation = async ({
  userId,
  live,
  currency,
  preferredBlockchains,
}: {
  userId: string;
  live: boolean;
  currency: Currency;
  preferredBlockchains: Blockchain[]; // expected to be ordered by priority
}): Promise<
  Result<Location, UnsupportedBlockchainError | BlockchainActionError>
> => {
  const currencyBalance = await getBalance({ userId, live, currency });
  if (!currencyBalance.ok) return currencyBalance;

  const balance = currencyBalance.value;

  const locations = await loadManyLocationsById({
    locationIds: balance?.holdings || [],
    userId,
    live,
  });

  const matchedLocation = matchLocation(locations, {
    blockchainsByPriority: preferredBlockchains,
  });
  if (matchedLocation) return ok(matchedLocation);

  // Create new holding on the first supported blockchain
  const supportedBlockchain = preferredBlockchains.find((blockchain) =>
    isCurrencySupported({
      blockchain,
      currency,
    })
  );

  if (!supportedBlockchain) {
    return err({
      type: "UnsupportedBlockchainError",
      currency,
      blockchains: preferredBlockchains,
    });
  }

  const newLocationResult = await createLocation({
    userId,
    live,
    blockchain: supportedBlockchain,
  });

  if (!newLocationResult.ok) return newLocationResult;

  return ok(newLocationResult.value);
};

const matchLocation = (
  locations: Location[],
  preferences: { blockchainsByPriority: Blockchain[] }
): Location | null => {
  if (locations.length === 0) return null;

  // TODO: Match the location type (crypto)

  let matchingLocation: Location | null = null;

  for (const preferredBlockchain of preferences.blockchainsByPriority) {
    const foundMatchingLocation = locations.find(
      (location) => location.blockchain === preferredBlockchain
    );

    if (foundMatchingLocation) matchingLocation = foundMatchingLocation;
  }

  return matchingLocation;
};
