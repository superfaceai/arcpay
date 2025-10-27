import { getOrThrow, ok, Result } from "@/lib";

import {
  loadManyLocationsById,
  loadLocationsByUser,
  Location,
  saveMultipleLocations,
} from "@/payments/entities";

import { getBlockchainWalletBalance } from "@/circle/adapters";
import { GetBlockchainWalletBalance } from "@/payments/interfaces";
import { BlockchainActionError } from "@/payments/errors";

export const listLocations = async ({
  userId,
  live,
  locationIds,
  getBlockchainWalletBalanceAdapter = getBlockchainWalletBalance,
}: {
  userId: string;
  live: boolean;
  locationIds?: string[];
  getBlockchainWalletBalanceAdapter?: GetBlockchainWalletBalance;
}): Promise<Result<Location[], BlockchainActionError>> => {
  const dbLocations =
    locationIds && locationIds.length > 0
      ? await loadManyLocationsById({
          locationIds: [...new Set(locationIds)],
          userId,
          live,
        })
      : await loadLocationsByUser({
          userId,
          live,
        });

  if (dbLocations.length === 0) return ok([]);

  const blockchainBalances = await Promise.all(
    dbLocations.map(async (location) => {
      return getBlockchainWalletBalanceAdapter({
        address: location.address,
        blockchain: location.blockchain,
        live: location.live,
      });
    })
  );

  const error = blockchainBalances.find((balance) => !balance.ok);
  if (error) return error;

  const updatedLocations = dbLocations.map((location, index) => {
    // getOrThrow is safe because we already checked for errors above
    const onchainAssets = getOrThrow(blockchainBalances[index]);

    return {
      ...location,
      assets: onchainAssets,
    };
  });

  // Get wallets that have changed assets
  const changedLocations = updatedLocations.filter((location) => {
    const formerLocation = dbLocations.find((l) => l.id === location.id);
    if (!formerLocation) return true;

    return location.assets.some(
      (asset) =>
        asset.amount !==
        formerLocation.assets.find((a) => a.currency === asset.currency)?.amount
    );
  });

  if (changedLocations.length > 0) {
    await saveMultipleLocations(changedLocations);
  }

  return ok(updatedLocations);
};
