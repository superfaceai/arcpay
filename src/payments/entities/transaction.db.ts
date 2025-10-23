import { db } from "@/database";
import { Transaction, transactionSortDesc } from "@/payments/entities";

const storageKeyById = ({ id }: { id: string }) => `tx:${id}`;
const storageKeyByWallet = ({ walletId }: { walletId: string }) =>
  `wallet:${walletId}:transactions`;

export const saveTransaction = async ({
  transaction,
  walletId,
}: {
  transaction: Transaction;
  walletId: string;
}) => {
  await db
    .multi()
    .hset(storageKeyById({ id: transaction.id }), transaction)
    .zadd(storageKeyByWallet({ walletId }), {
      score: transaction.created_at.getTime(),
      member: transaction.id,
    })
    .exec();

  return transaction;
};

export const saveManyTransactions = async ({
  transactions,
  walletId,
}: {
  transactions: Transaction[];
  walletId: string;
}) => {
  const pipeline = db.multi();

  for (const transaction of transactions) {
    pipeline.hset(storageKeyById({ id: transaction.id }), transaction);
    pipeline.zadd(storageKeyByWallet({ walletId }), {
      score: transaction.created_at.getTime(),
      member: transaction.id,
    });
  }

  await pipeline.exec();
};

export const loadTransactionById = async ({
  transactionId,
}: {
  transactionId: string;
}): Promise<Transaction | null> => {
  const transaction = await db.hgetall<Transaction>(
    storageKeyById({ id: transactionId })
  );

  if (!transaction) {
    return null;
  }

  return Transaction.parse(transaction);
};

export const loadTransactionsByWallet = async ({
  walletId,
  from,
  to,
}: {
  walletId: string;
  from?: Date;
  to?: Date;
}): Promise<Transaction[]> => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByWallet({ walletId }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const transactions = await Promise.all(
    transactionIds.map((transactionId) =>
      loadTransactionById({ transactionId })
    )
  );

  return transactions
    .filter((transaction) => transaction !== null)
    .sort(transactionSortDesc);
};

export const eraseTransactionsForWallet = async ({
  walletId,
}: {
  walletId: string;
}) => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByWallet({ walletId }),
    0,
    -1
  );

  const pipeline = db.pipeline();

  for (const transactionId of transactionIds) {
    pipeline.del(storageKeyById({ id: transactionId }));
    console.debug(
      `Removing Transaction '${transactionId}' for Wallet '${walletId}'`
    );
  }
  pipeline.del(storageKeyByWallet({ walletId }));

  await pipeline.exec();

  console.debug(`Removed Transactions for Wallet '${walletId}'`);
};
