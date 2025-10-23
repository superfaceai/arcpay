import { ok, Result } from "@/lib";

import { Balance, balanceId, loadBalancesByUser } from "@/payments/entities";

export const listBalances = async ({
  userId,
  live,
}: {
  userId: string;
  live: boolean;
}): Promise<Result<Balance[], void>> => {
  const dbBalances = await loadBalancesByUser({
    userId,
    live,
  });

  if (dbBalances.length > 0) return ok(dbBalances);

  // TODO: Fetch real holdings & sync

  const phantomBalances: Balance[] = [
    {
      id: balanceId("USDC"),
      owner: userId,
      live,
      currency: "USDC",
      amount: "0",
      holdings: [],
    },
  ];

  return ok(phantomBalances);
};
