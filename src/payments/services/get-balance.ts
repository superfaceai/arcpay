import { ok, Result } from "@/lib";

import { Balance, balanceId, loadBalance } from "@/payments/entities";
import { Currency } from "@/payments/values";

export const getBalance = async ({
  userId,
  live,
  currency,
}: {
  userId: string;
  live: boolean;
  currency: Currency;
}): Promise<Result<Balance, void>> => {
  const dbBalance = await loadBalance({
    userId,
    live,
    currency,
  });

  if (dbBalance) return ok(dbBalance);

  // TODO: Fetch real holdings & sync

  const phantomBalance: Balance = {
    id: balanceId(currency),
    owner: userId,
    live,
    currency,
    amount: "0",
    holdings: [],
  };

  return ok(phantomBalance);
};
