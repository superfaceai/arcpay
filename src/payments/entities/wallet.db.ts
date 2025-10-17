import { db } from "@/database/index.js";
import { Wallet } from "@/payments/entities/index.js";

const storageKeyById = ({ id }: { id: string }) => `wallet:${id}`;
const storageKeyByUser = ({ userId }: { userId: string }) =>
  `user:${userId}:wallets`;

export const saveWallet = async (wallet: Wallet) => {
  await db
    .multi()
    .hset(storageKeyById({ id: wallet.id }), wallet)
    .zadd(storageKeyByUser({ userId: wallet.owner }), {
      score: wallet.created_at.getTime(),
      member: wallet.id,
    })
    .exec();

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
  const wallet = await db.hgetall<Wallet>(storageKeyById({ id: walletId }));

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
  const walletIds = await db.zrange<string[]>(
    storageKeyByUser({ userId }),
    0,
    -1
  );

  const wallets = await Promise.all(
    walletIds.map((walletId) => loadWalletById({ walletId, userId, live }))
  );

  return wallets.filter((wallet) => wallet !== null);
};

export const eraseWalletsForUser = async ({ userId }: { userId: string }) => {
  // TODO: Transfer remaining funds somewhere?

  const liveWallets = await loadWalletsByUser({ userId, live: true });
  const testWallets = await loadWalletsByUser({ userId, live: false });

  const walletIds = [
    ...liveWallets.map((wallet) => wallet.id),
    ...testWallets.map((wallet) => wallet.id),
  ];

  if (walletIds.length === 0) return;

  for (const walletId of walletIds) {
    await db.del(storageKeyById({ id: walletId }));
    console.debug(`Removed Wallet '${walletId}' for User '${userId}'`);
  }
  await db.del(storageKeyByUser({ userId }));

  console.debug(`Removed Wallets for User '${userId}'`);
};
