import { db } from "@/database";
import {
  Balance,
  Location,
  saveLocationViaPipeline,
} from "@/payments/entities";
import { Currency } from "@/payments/values";

const storageKey = ({
  accountId,
  live,
  currency,
}: {
  accountId: string;
  live: boolean;
  currency: Currency | "*";
}) => `bal:${accountId}:${live ? "live" : "test"}:${currency}`;

export const saveBalance = async (balance: Balance) => {
  await db.hset(
    storageKey({
      accountId: balance.owner,
      live: balance.live,
      currency: balance.currency,
    }),
    balance
  );

  return balance;
};

export const saveMultipleBalances = async (balances: Balance[]) => {
  const pipeline = db.multi();

  for (const balance of balances) {
    pipeline.hset(
      storageKey({
        accountId: balance.owner,
        live: balance.live,
        currency: balance.currency,
      }),
      balance
    );
  }

  await pipeline.exec();
};

export const saveBalancesWithLocation = async ({
  balances,
  location,
}: {
  balances: Balance[];
  location: Location;
}) => {
  const pipeline = db.multi();

  for (const balance of balances) {
    pipeline.hset(
      storageKey({
        accountId: balance.owner,
        live: balance.live,
        currency: balance.currency,
      }),
      balance
    );
  }

  saveLocationViaPipeline({ location, pipeline });

  await pipeline.exec();
};

export const loadBalance = async ({
  accountId,
  live,
  currency,
}: {
  accountId: string;
  live: boolean;
  currency: Currency;
}): Promise<Balance | null> => {
  const balance = await db.hgetall<Balance>(
    storageKey({
      accountId,
      live,
      currency,
    })
  );

  if (!balance) return null;

  return Balance.parse(balance);
};

export const loadBalancesByAccount = async ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}): Promise<Balance[]> => {
  const pattern = storageKey({ accountId, live, currency: "*" });

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

export const eraseBalancesForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  // TODO: Transfer remaining funds somewhere?

  const eraseBalances = async ({ live }: { live: boolean }) => {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await db.scan(cursor, {
        match: storageKey({ accountId, live, currency: "*" }),
        count: 100_000,
      });
      cursor = nextCursor;

      if (keys.length) {
        const delCount = await db.del(...keys);
        deletedCount += delCount;
      }
    } while (cursor !== "0");

    console.debug(
      `Removed ${deletedCount} Balances for Account '${accountId}' (Live: ${live})`
    );
  };

  await eraseBalances({ live: true });
  await eraseBalances({ live: false });
};
