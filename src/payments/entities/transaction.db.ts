import { db, Pipeline } from "@/database";
import { Transaction, transactionSortDesc } from "@/payments/entities";

const storageKeyById = ({ id }: { id: string }) => `tx:${id}`;
const storageKeyByAccount = ({ accountId }: { accountId: string }) =>
  `acct:${accountId}:transactions`;

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
    .hset(storageKeyById({ id: transaction.id }), transaction)
    .zadd(storageKeyByAccount({ accountId }), {
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

export const loadTransactionsByAccount = async ({
  accountId,
  from,
  to,
}: {
  accountId: string;
  from?: Date;
  to?: Date;
}): Promise<Transaction[]> => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId }),
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

export const eraseTransactionsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const transactionIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId }),
    0,
    -1
  );

  const pipeline = db.pipeline();

  for (const transactionId of transactionIds) {
    pipeline.del(storageKeyById({ id: transactionId }));
    console.debug(
      `Removing Transaction '${transactionId}' for Account '${accountId}'`
    );
  }
  pipeline.del(storageKeyByAccount({ accountId }));

  await pipeline.exec();

  console.debug(`Removed Transactions for Account '${accountId}'`);
};
