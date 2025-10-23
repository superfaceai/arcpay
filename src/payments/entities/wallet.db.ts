import { db } from "@/database";
import { Wallet } from "@/payments/entities";

const storageKey = ({
  userId,
  live,
  id,
}: {
  userId: string;
  live: boolean;
  id: string;
}) => `user:${userId}:wallets:${live ? "live" : "test"}:${id}`;

export const saveWallet = async (wallet: Wallet) => {
  await db.hset(
    storageKey({ userId: wallet.owner, live: wallet.live, id: wallet.id }),
    wallet
  );

  return wallet;
};

export const loadWalletById = async ({
  walletId,
  userId,
  live,
}: {
  walletId: string;
  userId: string;
  live: boolean;
}): Promise<Wallet | null> => {
  const wallet = await db.hgetall<Wallet>(
    storageKey({ userId, live, id: walletId })
  );

  if (!wallet || wallet.live !== live || wallet.owner !== userId) {
    return null;
  }

  return Wallet.parse(wallet);
};

export const loadWalletsByUser = async ({
  userId,
  live,
}: {
  userId: string;
  live: boolean;
}): Promise<Wallet[]> => {
  const pattern = storageKey({ userId, live, id: "*" });

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

  const walletsPipeline = db.pipeline();
  for (const key of allKeys) {
    walletsPipeline.hgetall<Wallet>(key);
  }
  const walletsRaw = await walletsPipeline.exec<Wallet[]>();

  return walletsRaw
    .filter((wallet) => !!wallet)
    .map((wallet) => Wallet.parse(wallet));
};

export const eraseWalletsForUser = async ({ userId }: { userId: string }) => {
  // TODO: Transfer remaining funds somewhere?

  const eraseWallets = async ({ live }: { live: boolean }) => {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await db.scan(cursor, {
        match: storageKey({ userId, live, id: "*" }),
        count: 100_000,
      });
      cursor = nextCursor;

      if (keys.length) {
        const delCount = await db.del(...keys);
        deletedCount += delCount;
      }
    } while (cursor !== "0");

    console.debug(
      `Removed ${deletedCount} Wallets for User '${userId}' (Live: ${live})`
    );
  };

  await eraseWallets({ live: true });
  await eraseWallets({ live: false });
};
