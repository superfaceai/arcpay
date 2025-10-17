import {
  Transaction as CircleTransaction,
  EstimateTransactionFeeData,
  TokenBlockchain,
  TransactionState,
} from "@circle-fin/developer-controlled-wallets";

import { Result, tryAsync } from "@/lib/index.js";
import {
  Blockchain,
  Amount,
  getNativeTokenFor,
  mainToken,
} from "@/payments/values/index.js";
import { Transaction, TransactionStatus } from "@/payments/entities/index.js";

import { client } from "./client.js";
import {
  CircleCreateTransactionError,
  CircleFetchTransactionsError,
  CircleEstimateFeesError,
} from "./errors.js";
import {
  chooseCircleBlockchain,
  getCircleBlockchainExplorerUrl,
  getCoreBlockchainFor,
} from "./blockchain.js";
import { circleTokenIdToToken } from "./token.js";

export const createTransaction = async ({
  transaction,
  sourceWalletId,
  blockchain,
  tokenAddress,
  live,
}: {
  transaction: Transaction;
  sourceWalletId: string;
  blockchain: Blockchain;
  tokenAddress: string;
  live: boolean;
}): Promise<Result<Transaction, CircleCreateTransactionError>> =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      const tx = await client.createTransaction({
        walletId: sourceWalletId,
        blockchain: chain as TokenBlockchain,
        amount: [transaction.amount],
        destinationAddress: transaction.counterparty,
        tokenAddress,
        idempotencyKey: transaction.fingerprint,
        refId: transaction.id,
        fee: {
          type: "level",
          config: { feeLevel: "LOW" },
        },
      });

      if (!tx.data) {
        throw new Error("Could not create transaction");
      }

      const sentTransaction: Transaction = {
        ...transaction,
        status: mapTransactionState(tx.data.state),
        processor: {
          name: "circle",
          id: tx.data.id,
          state: tx.data.state,
        },
      };

      return sentTransaction;
    },
    (error) => {
      console.error((error as any).response.data);
      return {
        type: "CircleCreateTransactionError",
        message: String(error),
      };
    }
  );

export const fetchWalletTransactions = async ({
  circleWalletId,
  from,
  to,
}: {
  circleWalletId: string;
  from?: Date;
  to?: Date;
}): Promise<Result<Omit<Transaction, "id">[], CircleFetchTransactionsError>> =>
  tryAsync(
    async () => {
      const transactions = await client.listTransactions({
        walletIds: [circleWalletId],
        operation: "TRANSFER",
        order: "DESC",
        ...(from ? { from: from.toISOString() } : {}),
        ...(to ? { to: to.toISOString() } : {}),
        includeAll: true,
      });

      if (!transactions.data?.transactions) {
        return [];
      }

      return await Promise.all(
        transactions.data.transactions.map((circleTx) =>
          mapTransaction({ circleTx })
        )
      );
    },
    (error) => {
      console.error((error as any).response.data);
      return {
        type: "CircleFetchTransactionsError",
        message: String(error),
      };
    }
  );

export const estimateFees = async ({
  destinationAddress,
  sourceAddress,
  tokenAddress,
  amount,
  blockchain,
  live,
}: {
  destinationAddress: string;
  sourceAddress: string;
  tokenAddress: string;
  amount: Amount;
  blockchain: Blockchain;
  live: boolean;
}): Promise<Result<EstimateTransactionFeeData, CircleEstimateFeesError>> =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      const fees = await client.estimateTransferFee({
        destinationAddress,
        amount: [amount],
        tokenAddress,
        sourceAddress,
        blockchain: chain as TokenBlockchain,
      });

      if (!fees.data) {
        throw new Error("Received invalid response from Circle");
      }

      return fees.data;
    },
    (error) => {
      return {
        type: "CircleEstimateFeesError",
        message: String(error),
      };
    }
  );

const mapTransactionState = (state: TransactionState): TransactionStatus => {
  return STATUS_MAPPING[state];
};

const mapTransaction = async ({
  circleTx,
}: {
  circleTx: CircleTransaction;
}): Promise<Omit<Transaction, "id">> => {
  const txCurrency = await circleTokenIdToToken(circleTx.tokenId ?? "");
  const coreBlockchain = getCoreBlockchainFor({
    blockchain: circleTx.blockchain,
  });
  const nativeToken = getNativeTokenFor({ blockchain: coreBlockchain });

  const fees: Transaction["fees"] = [];

  if (circleTx.networkFee) {
    fees.push({
      type: "network",
      amount: circleTx.networkFee ?? "0",
      currency: mainToken(nativeToken),
    });
  }

  return {
    status: mapTransactionState(circleTx.state),
    amount: circleTx.amounts?.[0] ?? "0",
    currency: mainToken(txCurrency),
    fees,
    counterparty:
      circleTx.transactionType === "INBOUND"
        ? circleTx.sourceAddress ?? ""
        : circleTx.destinationAddress ?? "",
    processor: {
      name: "circle",
      id: circleTx.id,
      state: circleTx.state,
    },
    blockchain: {
      hash: circleTx.txHash ?? "",
      explorer_url: getCircleBlockchainExplorerUrl({
        blockchain: circleTx.blockchain,
        txHash: circleTx.txHash,
      }),
    },
    created_at: new Date(circleTx.createDate),
  };
};

const STATUS_MAPPING: Record<TransactionState, TransactionStatus> = {
  PENDING_RISK_SCREENING: "queued",
  QUEUED: "queued",
  INITIATED: "sent",
  SENT: "sent",
  CONFIRMED: "confirmed",
  COMPLETE: "completed",
  DENIED: "failed",
  FAILED: "failed",
  CANCELLED: "canceled",
};
