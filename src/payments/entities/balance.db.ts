import { db } from "@/database";
import { Balance } from "@/payments/entities";
import { Currency } from "@/payments/values";

const storageKey = ({
  userId,
  live,
  currency,
}: {
  userId: string;
  live: boolean;
  currency: Currency | "*";
}) => `user:${userId}:balances:${live ? "live" : "test"}:${currency}`;

export const saveBalance = async ({ balance }: { balance: Balance }) => {
  await db.hset(
    storageKey({
      userId: balance.owner,
      live: balance.live,
      currency: balance.currency,
    }),
    balance
  );

  return balance;
};

export const loadBalance = async ({
  userId,
  live,
  currency,
}: {
  userId: string;
  live: boolean;
  currency: Currency;
}): Promise<Balance | null> => {
  const balance = await db.hgetall<Balance>(
    storageKey({
      userId,
      live,
      currency,
    })
  );

  if (!balance) return null;

  return Balance.parse(balance);
};

export const loadBalancesByUser = async ({
  userId,
  live,
}: {
  userId: string;
  live: boolean;
}): Promise<Balance[]> => {
  const pattern = storageKey({ userId, live, currency: "*" });

  let cursor = "0";
  const allKeys: string[] = [];

  do {
    const [nextCursor, keys] = await db.scan(cursor, {
      match: pattern,
      count: 100_000,
    });
    if (Array.isArray(keys) && keys.length > 0) {
      allKeys.push(...keys);
    }
    cursor = nextCursor;
  } while (cursor !== "0");

  if (allKeys.length === 0) return [];

  const balancesPipeline = db.pipeline();
  for (const key of allKeys) {
    balancesPipeline.hgetall<Balance>(key);
  }
  const balancesRaw = await balancesPipeline.exec<Balance[]>();

  return balancesRaw
    .filter((balance) => !!balance)
    .map((balance) => Balance.parse(balance));
};

export const eraseBalancesForUser = async ({ userId }: { userId: string }) => {
  // TODO: Transfer remaining funds somewhere?

  const eraseBalances = async ({ live }: { live: boolean }) => {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await db.scan(cursor, {
        match: storageKey({ userId, live, currency: "*" }),
        count: 100_000,
      });
      cursor = nextCursor;

      if (keys.length) {
        const delCount = await db.del(...keys);
        deletedCount += delCount;
      }
    } while (cursor !== "0");

    console.debug(
      `Removed ${deletedCount} Balances for User '${userId}' (Live: ${live})`
    );
  };

  await eraseBalances({ live: true });
  await eraseBalances({ live: false });
};
