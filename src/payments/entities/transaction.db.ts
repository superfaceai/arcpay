import { db, Pipeline } from "@/database";
import { Transaction, transactionSortDesc } from "@/payments/entities";

const storageKeyById = ({
  id,
  accountId,
  live,
}: {
  id: string;
  accountId: string;
  live: boolean;
}) => `txn:${accountId}:${live ? "live" : "test"}:${id}`;
const storageKeyByAccount = ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => `txns:${accountId}:${live ? "live" : "test"}`;

export const saveTransaction = async ({
  transaction,
  accountId,
}: {
  transaction: Transaction;
  accountId: string;
}) => {
  const pipeline = db.multi();
  saveTransactionViaPipeline({ transaction, accountId, pipeline });
  await pipeline.exec();

  return transaction;
};

export const saveTransactionViaPipeline = ({
  transaction,
  accountId,
  pipeline,
}: {
  transaction: Transaction;
  accountId: string;
  pipeline: Pipeline;
}) => {
  pipeline
    .hset(
      storageKeyById({ id: transaction.id, accountId, live: transaction.live }),
      transaction
    )
    .zadd(storageKeyByAccount({ accountId, live: transaction.live }), {
      score: transaction.created_at.getTime(),
      member: transaction.id,
    });

  return pipeline;
};

export const saveManyTransactions = async ({
  transactions,
  accountId,
}: {
  transactions: Transaction[];
  accountId: string;
}) => {
  const pipeline = db.multi();
  for (const transaction of transactions) {
    saveTransactionViaPipeline({ transaction, accountId, pipeline });
  }

  await pipeline.exec();
};

export const loadTransactionById = async ({
  accountId,
  transactionId,
  live,
}: {
  accountId: string;
  transactionId: string;
  live: boolean;
}): Promise<Transaction | null> => {
  const transaction = await db.hgetall<Transaction>(
    storageKeyById({ id: transactionId, accountId, live })
  );

  if (!transaction) {
    return null;
  }

  return Transaction.parse(transaction);
};

export const loadTransactionsByAccount = async ({
  accountId,
  live,
  from,
  to,
}: {
  accountId: string;
  live: boolean;
  from?: Date;
  to?: Date;
}): Promise<Transaction[]> => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId, live }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const transactions = await Promise.all(
    transactionIds.map((transactionId) =>
      loadTransactionById({ accountId, transactionId, live })
    )
  );

  return transactions
    .filter((transaction) => transaction !== null)
    .sort(transactionSortDesc);
};

export const eraseTransactionsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const eraseTransactions = async ({ live }: { live: boolean }) => {
    const transactionIds = await db.zrange<string[]>(
      storageKeyByAccount({ accountId, live }),
      0,
      -1
    );

    const pipeline = db.pipeline();

    for (const transactionId of transactionIds) {
      pipeline.del(storageKeyById({ id: transactionId, accountId, live }));
      console.debug(
        `Removing Transaction '${transactionId}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await eraseTransactions({ live: true });
  await eraseTransactions({ live: false });

  console.debug(`Removed Transactions for Account '${accountId}'`);
};
