import { ok, Result } from "@/lib";

import { BlockchainActionError } from "@/payments/errors";
import { Balance, loadBalance, saveBalance } from "@/payments/entities";

import { Currency } from "@/payments/values";
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
}): Promise<Result<Balance | null, BlockchainActionError>> => {
  const dbBalance = await loadBalance({
    accountId,
    live,
    currency,
  });

  if (!dbBalance) return ok(null);

  const locationsResult = await listLocations({
    accountId,
    live,
    locationIds: dbBalance.holdings,
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
