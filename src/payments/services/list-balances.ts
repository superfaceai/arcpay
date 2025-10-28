import { ok, Result } from "@/lib";

import {
  Balance,
  loadBalancesByAccount,
  saveMultipleBalances,
} from "@/payments/entities";
import { BlockchainActionError } from "@/payments/errors";

import { listLocations } from "./list-locations";
import { syncBalanceWithLocations } from "./sync-balance-with-locations";

export const listBalances = async ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}): Promise<Result<Balance[], BlockchainActionError>> => {
  const dbBalances = await loadBalancesByAccount({
    accountId,
    live,
  });

  if (dbBalances.length === 0) return ok([]);

  const allLocationIds = [
    ...new Set(dbBalances.flatMap((balance) => balance.locations)),
  ];

  const allLocationsResult = await listLocations({
    accountId,
    live,
    locationIds: allLocationIds,
  });

  if (!allLocationsResult.ok) return allLocationsResult;

  const syncedBalances: Balance[] = [];
  const changedBalances: Balance[] = [];

  for (const balance of dbBalances) {
    const { balance: syncedBalance, changed } = syncBalanceWithLocations({
      balance,
      locations: allLocationsResult.value.filter((location) =>
        balance.locations.includes(location.id)
      ),
    });

    syncedBalances.push(syncedBalance);

    if (changed) {
      changedBalances.push(syncedBalance);
    }
  }

  if (changedBalances.length > 0) {
    await saveMultipleBalances(changedBalances);
  }

  return ok(syncedBalances);
};
