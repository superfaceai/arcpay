import { db, Pipeline } from "@/database";
import { Transaction, transactionSortDesc } from "@/payments/entities";

const storageKeyById = ({ id }: { id: string }) => `tx:${id}`;
const storageKeyByUser = ({ userId }: { userId: string }) =>
  `user:${userId}:transactions`;

export const saveTransaction = async ({
  transaction,
  userId,
}: {
  transaction: Transaction;
  userId: string;
}) => {
  const pipeline = db.multi();
  saveTransactionViaPipeline({ transaction, userId, pipeline });
  await pipeline.exec();

  return transaction;
};

export const saveTransactionViaPipeline = ({
  transaction,
  userId,
  pipeline,
}: {
  transaction: Transaction;
  userId: string;
  pipeline: Pipeline;
}) => {
  pipeline
    .hset(storageKeyById({ id: transaction.id }), transaction)
    .zadd(storageKeyByUser({ userId }), {
      score: transaction.created_at.getTime(),
      member: transaction.id,
    });

  return pipeline;
};

export const saveManyTransactions = async ({
  transactions,
  userId,
}: {
  transactions: Transaction[];
  userId: string;
}) => {
  const pipeline = db.multi();
  for (const transaction of transactions) {
    saveTransactionViaPipeline({ transaction, userId, pipeline });
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

export const loadTransactionsByUser = async ({
  userId,
  from,
  to,
}: {
  userId: string;
  from?: Date;
  to?: Date;
}): Promise<Transaction[]> => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByUser({ userId }),
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

export const eraseTransactionsForUser = async ({
  userId,
}: {
  userId: string;
}) => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByUser({ userId }),
    0,
    -1
  );

  const pipeline = db.pipeline();

  for (const transactionId of transactionIds) {
    pipeline.del(storageKeyById({ id: transactionId }));
    console.debug(
      `Removing Transaction '${transactionId}' for User '${userId}'`
    );
  }
  pipeline.del(storageKeyByUser({ userId }));

  await pipeline.exec();

  console.debug(`Removed Transactions for User '${userId}'`);
};
