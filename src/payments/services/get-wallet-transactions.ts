import { z } from "zod";
import {
  CircleFetchTransactionsError,
  fetchWalletTransactions,
} from "@/circle/index.js";
import { DateCodec, ok, Result } from "@/lib/index.js";
import {
  Wallet,
  Transaction,
  transactionSortDesc,
  TransactionStatus,
  loadTransactionsByWallet,
  saveManyTransactions,
  transactionId,
} from "@/payments/entities/index.js";

export const GetWalletTransactionsDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const getWalletTransactions = async ({
  wallet,
  dto,
}: {
  wallet: Wallet;
  dto: z.infer<typeof GetWalletTransactionsDTO>;
}): Promise<Result<Transaction[], CircleFetchTransactionsError>> => {
  const [dbTransactions, onchainWalletTransactions] = await Promise.all([
    loadTransactionsByWallet({
      walletId: wallet.id,
      from: dto.from,
      to: dto.to,
    }),
    fetchWalletTransactions({
      circleWalletId: wallet.circle.id,
      from: dto.from,
      to: dto.to,
    }),
  ]);

  if (!onchainWalletTransactions.ok) {
    console.error(onchainWalletTransactions.error);
    return onchainWalletTransactions;
  }

  const mergeResult = mergeTransactionsByExternalId({
    dbTransactions,
    onchainTransactions: onchainWalletTransactions.value,
  });

  // TODO: Move this to a background job after responding
  if (mergeResult.newTransactions.length > 0) {
    await saveManyTransactions({
      transactions: mergeResult.newTransactions,
      walletId: wallet.id,
    });
  }

  if (mergeResult.updatedTransactionIds.length > 0) {
    await saveManyTransactions({
      transactions: mergeResult.transactions.filter((tx) =>
        mergeResult.updatedTransactionIds.includes(tx.id)
      ),
      walletId: wallet.id,
    });
  }

  const queuedTransactions = mergeResult.transactions.filter(
    (tx) => tx.status === "queued"
  );
  await retryQueuedTransactions({
    transactions: queuedTransactions,
    walletId: wallet.id,
  });

  return ok(mergeResult.transactions);
};

type TransactionMerge = {
  transactions: Transaction[];
  newTransactions: Transaction[];
  updatedTransactionIds: string[];
};

const mergeTransactionsByExternalId = ({
  dbTransactions,
  onchainTransactions,
}: {
  dbTransactions: Transaction[];
  onchainTransactions: Omit<Transaction, "id">[];
}): TransactionMerge => {
  const newTransactions: Transaction[] = [];
  const mergedTransactions: Transaction[] = dbTransactions.slice();
  const updatedTransactionIds: string[] = [];

  for (const onchainTx of onchainTransactions) {
    const dbTxIx = mergedTransactions.findIndex(
      (transaction) => transaction.processor?.id === onchainTx.processor?.id
    );

    if (dbTxIx === -1) {
      // New transaction found in onchain list
      newTransactions.push(
        Transaction.parse({
          id: transactionId(),
          ...onchainTx,
        })
      );
      continue;
    }

    const dbTx = mergedTransactions[dbTxIx];
    if (shouldUpdateTransaction(dbTx)) {
      const updatedTx: Transaction = {
        id: dbTx.id,
        ...onchainTx,
      };
      updatedTransactionIds.push(updatedTx.id);
      mergedTransactions.splice(dbTxIx, 1, updatedTx);
      continue;
    } else {
      continue;
    }
  }

  const transactions = [...newTransactions, ...mergedTransactions].sort(
    transactionSortDesc
  );

  return {
    transactions,
    newTransactions,
    updatedTransactionIds,
  };
};

const FINAL_STATES: TransactionStatus[] = ["completed", "failed", "canceled"];

const shouldUpdateTransaction = (tx: Transaction): boolean => {
  return !FINAL_STATES.includes(tx.status);
};

const retryQueuedTransactions = async ({
  transactions,
  walletId,
}: {
  transactions: Transaction[];
  walletId: string;
}): Promise<void> => {
  // TODO: Retry `queued` transactions (if they have `fingerprint` set, otherwise fail)
};
