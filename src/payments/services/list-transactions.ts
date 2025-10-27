import { z } from "zod";

import { DateCodec, ok, Result } from "@/lib";
import {
  Transaction,
  transactionSortDesc,
  loadTransactionsByUser,
  saveManyTransactions,
  transactionId,
  loadLocationsByUser,
  isTransactionFinalized,
  remoteTransactionId,
} from "@/payments/entities";
import { BlockchainActionError } from "@/payments/errors";

import {
  BlockchainTransaction,
  ListBlockchainWalletTransactions,
} from "@/payments/interfaces";
import { listBlockchainWalletTransactions } from "@/circle/adapters";

export const ListTransactionsDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const listTransactions = async ({
  filter,
  userId,
  live,
  listBlockchainWalletTransactionsAdapter = listBlockchainWalletTransactions,
}: {
  filter: z.infer<typeof ListTransactionsDTO>;
  userId: string;
  live: boolean;
  listBlockchainWalletTransactionsAdapter?: ListBlockchainWalletTransactions;
}): Promise<Result<Transaction[], BlockchainActionError>> => {
  const [dbTransactions, locations] = await Promise.all([
    loadTransactionsByUser({ userId, from: filter.from, to: filter.to }),
    loadLocationsByUser({ userId, live: false }),
  ]);

  const onchainWalletTransactions =
    await listBlockchainWalletTransactionsAdapter({
      wallets: locations
        .filter((l) => l.type === "crypto_wallet")
        .map((location) => ({
          locationId: location.id,
          address: location.address,
          blockchain: location.blockchain,
        })),
      from: filter.from,
      to: filter.to,
      live,
    });

  if (!onchainWalletTransactions.ok) {
    console.error(onchainWalletTransactions.error);
    return onchainWalletTransactions;
  }

  const mergeResult = mergeTransactionsWithRemote({
    dbTransactions,
    remoteTransactions: onchainWalletTransactions.value,
  });

  // TODO: Move this to a background job after responding
  if (mergeResult.newTransactions.length > 0) {
    await saveManyTransactions({
      transactions: mergeResult.newTransactions,
      userId,
    });
  }

  if (mergeResult.updatedTransactionIds.length > 0) {
    await saveManyTransactions({
      transactions: mergeResult.transactions.filter((tx) =>
        mergeResult.updatedTransactionIds.includes(tx.id)
      ),
      userId,
    });
  }

  await retryQueuedTransactions({
    transactions: mergeResult.transactions.filter(
      (tx) => tx.status === "queued"
    ),
  });

  return ok(mergeResult.transactions);
};

type TransactionMerge = {
  transactions: Transaction[];
  newTransactions: Transaction[];
  updatedTransactionIds: string[];
};

const mergeTransactionsWithRemote = ({
  dbTransactions,
  remoteTransactions,
}: {
  dbTransactions: Transaction[];
  remoteTransactions: BlockchainTransaction[];
}): TransactionMerge => {
  const newTransactions: Transaction[] = [];
  const mergedTransactions: Transaction[] = dbTransactions.slice();
  const updatedTransactionIds: string[] = [];

  for (const remoteTx of remoteTransactions) {
    const dbTxIx = mergedTransactions.findIndex(
      (transaction) =>
        transaction.type === remoteTx.type &&
        remoteTransactionId(transaction) === remoteTransactionId(remoteTx)
    );

    if (dbTxIx === -1) {
      // New transaction found in onchain list
      newTransactions.push(
        Transaction.parse({
          id: transactionId(),
          ...remoteTx,
        })
      );
      continue;
    }

    const dbTx = mergedTransactions[dbTxIx];
    if (!isTransactionFinalized(dbTx)) {
      const updatedTx: Transaction =
        remoteTx.type === "payment" && dbTx.type === "payment"
          ? {
              ...dbTx,
              ...remoteTx,
            }
          : {
              ...dbTx,
              ...remoteTx,
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

/**
 * [NOT IMPLEMENTED] TODO: Retry `queued` transactions (if they have `fingerprint` set, otherwise fail)
 */
const retryQueuedTransactions = async ({
  transactions,
}: {
  transactions: Transaction[];
}): Promise<void> => {
  if (transactions.length === 0) return;

  console.debug(
    "TODO: Retry queued transactions",
    transactions.map((tx) => tx.id)
  );
};
