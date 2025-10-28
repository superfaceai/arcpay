import { ok, Result } from "@/lib";

import { BlockchainWalletActionError } from "@/balances/errors";
import { Balance, loadBalance, saveBalance } from "@/balances/entities";

import { Currency } from "@/balances/values";
import { listLocations } from "./list-locations";
import { syncBalanceWithLocations } from "./sync-balance-with-locations";

export const getBalance = async ({
  accountId,
  live,
  currency,
}: {
  accountId: string;
  live: boolean;
  currency: Currency;
}): Promise<Result<Balance | null, BlockchainWalletActionError>> => {
  const dbBalance = await loadBalance({
    accountId,
    live,
    currency,
  });

  if (!dbBalance) return ok(null);

  const locationsResult = await listLocations({
    accountId,
    live,
    locationIds: dbBalance.locations,
  });

  if (!locationsResult.ok) return locationsResult;

  const { balance: syncedBalance, changed } = syncBalanceWithLocations({
    balance: dbBalance,
    locations: locationsResult.value,
  });

  if (changed) {
    await saveBalance(syncedBalance);
  }

  return ok(syncedBalance);
};
