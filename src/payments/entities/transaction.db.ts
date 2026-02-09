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

const storageKeyFeeIdempotency = ({
  accountId,
  transaction,
}: {
  accountId: string;
  transaction: Extract<Transaction, { type: "fee" }>;
}) =>
  `txnidx:fee:${accountId}:${transaction.live ? "live" : "test"}:${transaction.location}:${transaction.fee_type}:${transaction.purpose}:${transaction.blockchain.hash.toLowerCase()}`;

const persistTransaction = async ({
  transaction,
  accountId,
}: {
  transaction: Transaction;
  accountId: string;
}) => {
  const pipeline = db.multi();
  saveTransactionViaPipeline({ transaction, accountId, pipeline });
  await pipeline.exec();
};

export const saveTransaction = async ({
  transaction,
  accountId,
}: {
  transaction: Transaction;
  accountId: string;
}) => {
  if (transaction.type === "fee") {
    const claimed = await db.set(
      storageKeyFeeIdempotency({ accountId, transaction }),
      transaction.id,
      { nx: true }
    );
    if (!claimed) {
      return transaction;
    }
  }

  await persistTransaction({ transaction, accountId });

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
  const nonFeeTransactions = transactions.filter((tx) => tx.type !== "fee");
  if (nonFeeTransactions.length > 0) {
    const pipeline = db.multi();
    for (const transaction of nonFeeTransactions) {
      saveTransactionViaPipeline({ transaction, accountId, pipeline });
    }
    await pipeline.exec();
  }

  const feeTransactions = transactions.filter((tx) => tx.type === "fee");
  for (const transaction of feeTransactions) {
    await saveTransaction({ transaction, accountId });
  }
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
    const transactions = await Promise.all(
      transactionIds.map((transactionId) =>
        loadTransactionById({ accountId, transactionId, live })
      )
    );

    const pipeline = db.pipeline();

    for (const transaction of transactions) {
      if (!transaction) {
        continue;
      }

      pipeline.del(
        storageKeyById({ id: transaction.id, accountId, live: transaction.live })
      );
      if (transaction.type === "fee") {
        pipeline.del(storageKeyFeeIdempotency({ accountId, transaction }));
      }
      console.debug(
        `Removing Transaction '${transaction.id}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await eraseTransactions({ live: true });
  await eraseTransactions({ live: false });

  console.debug(`Removed Transactions for Account '${accountId}'`);
};
