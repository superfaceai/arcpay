import Big from "big.js";

import {
  TransactionState as CircleTransactionState,
  Transaction as CircleTransaction,
} from "@circle-fin/developer-controlled-wallets";

import {
  Amount,
  getNativeTokenFor,
  mainToken,
  tokenToCurrency,
} from "@/balances/values";
import { BlockchainTransaction } from "@/payments/interfaces";
import { isTransactionFinalized, TransactionStatus } from "@/payments/entities";

import { mapCircleTokenIdToToken } from "./map-circle-token-id";
import {
  getCircleBlockchainExplorerUrl,
  mapCircleBlockchain,
} from "../blockchain";

export const mapCircleTransactionState = (
  state: CircleTransactionState
): TransactionStatus => {
  return STATUS_MAPPING[state];
};

export const mapCircleTransaction = async ({
  circleTx,
  walletIdToLocation,
}: {
  circleTx: CircleTransaction;
  walletIdToLocation: Record<string, string>;
}): Promise<BlockchainTransaction[]> => {
  const paymentToken = await mapCircleTokenIdToToken(circleTx.tokenId ?? "");
  const blockchain = mapCircleBlockchain(circleTx.blockchain);
  const nativeToken = getNativeTokenFor({ blockchain });

  const hash = circleTx.txHash ?? "";
  const status = mapCircleTransactionState(circleTx.state);
  const created_at = new Date(circleTx.createDate);
  const finished_at =
    isTransactionFinalized({ status }) && circleTx.updateDate
      ? new Date(circleTx.updateDate)
      : undefined;
  const explorer_url = getCircleBlockchainExplorerUrl({
    blockchain: circleTx.blockchain,
    txHash: hash,
  });

  if (!hash) {
    throw new Error("Transaction hash is unknown");
  }

  const location = walletIdToLocation[circleTx.walletId ?? ""];

  if (!location) {
    throw new Error("Location ID is unknown");
  }

  const transactions: BlockchainTransaction[] = [];

  if (circleTx.networkFee && circleTx.transactionType === "OUTBOUND") {
    transactions.push({
      type: "fee",
      amount: mapAmount(circleTx.networkFee, { negative: true }),
      currency: tokenToCurrency(mainToken(nativeToken)),
      status,
      fee_type: "network",
      network: "blockchain",
      blockchain: {
        hash,
      },
      location: location,
      created_at,
      ...(finished_at ? { finished_at } : {}),
    });
  }

  transactions.push({
    type: "payment",
    status,
    amount: mapAmount(circleTx.amounts?.[0], {
      negative: circleTx.transactionType === "OUTBOUND",
    }),
    currency: tokenToCurrency(paymentToken),
    network: "blockchain",
    blockchain: {
      hash,
      explorer_url,
      counterparty:
        circleTx.transactionType === "INBOUND"
          ? circleTx.sourceAddress ?? ""
          : circleTx.destinationAddress ?? "",
    },
    location: location,
    created_at,
    ...(finished_at ? { finished_at } : {}),
  });

  return transactions;
};

const STATUS_MAPPING: Record<CircleTransactionState, TransactionStatus> = {
  QUEUED: "queued",
  STUCK: "sent",
  CLEARED: "sent",
  INITIATED: "sent",
  SENT: "sent",
  CONFIRMED: "confirmed",
  COMPLETE: "completed",
  DENIED: "failed",
  FAILED: "failed",
  CANCELLED: "canceled",
};

const mapAmount = (
  amount: string | undefined,
  { negative }: { negative: boolean }
): Amount => {
  if (!amount) {
    return "0";
  }
  return Big(amount)
    .abs()
    .mul(negative ? -1 : 1)
    .toString();
};
