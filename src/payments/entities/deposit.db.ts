import { db } from "@/database/index.js";
import { Deposit } from "@/payments/entities/index.js";

const storageKeyById = ({ id }: { id: string }) => `deposit:${id}`;
const storageKeyByWallet = ({ walletId }: { walletId: string }) =>
  `wallet:${walletId}:deposits`;

export const saveDeposit = async (deposit: Deposit) => {
  await db
    .multi()
    .hset(storageKeyById({ id: deposit.id }), deposit)
    .zadd(storageKeyByWallet({ walletId: deposit.wallet }), {
      score: deposit.created_at.getTime(),
      member: deposit.id,
    })
    .exec();

  return deposit;
};

export const loadDepositById = async ({
  depositId,
}: {
  depositId: string;
}): Promise<Deposit | null> => {
  const deposit = await db.hgetall<Deposit>(storageKeyById({ id: depositId }));

  if (!deposit) {
    return null;
  }

  return Deposit.parse(deposit);
};

export const loadDepositsByWallet = async ({
  walletId,
}: {
  walletId: string;
}): Promise<Deposit[]> => {
  const depositIds = await db.zrange<string[]>(
    storageKeyByWallet({ walletId }),
    0,
    -1
  );

  const deposits = await Promise.all(
    depositIds.map((depositId) => loadDepositById({ depositId }))
  );

  return deposits.filter((deposit) => deposit !== null);
};

export const eraseDepositsForWallet = async ({
  walletId,
}: {
  walletId: string;
}) => {
  const deposits = await loadDepositsByWallet({ walletId });

  if (deposits.length === 0) return;

  for (const deposit of deposits) {
    await db.del(storageKeyById({ id: deposit.id }));
    console.debug(`Removed Deposit '${deposit.id}' for Wallet '${walletId}'`);
  }

  await db.del(storageKeyByWallet({ walletId }));
  console.debug(`Removed Deposits for Wallet '${walletId}'`);
};
