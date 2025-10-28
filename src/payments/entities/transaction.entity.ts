import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Amount, Currency } from "@/balances/values";
import { Location } from "@/balances/entities";
import { Payment } from "./payment.entity";

export const transactionId = () => generateId("txn");

export const TransactionStatus = z.enum([
  "queued",
  "sent",
  "confirmed",
  "completed",
  "failed",
  "canceled",
]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

const TransactionBase = z.object({
  id: z.string(),
  amount: Amount,
  currency: Currency,
  live: z.boolean(),
  status: TransactionStatus,
  failure_reason: z.string().optional(),
  cancellation_reason: z.string().optional(),
  location: Location.shape.id,
  payment: Payment.shape.id.optional(),
  created_at: DateCodec,
  finished_at: DateCodec.optional(),
});

export const PaymentTransaction = TransactionBase.extend({
  type: z.literal("payment"),
  network: z.enum(["blockchain"]),
  blockchain: z.object({
    hash: z.string(),
    counterparty: z.string(),
    explorer_url: z.string().optional(),
  }),
  fingerprint: z.uuidv4().optional(),
});
export type PaymentTransaction = z.infer<typeof PaymentTransaction>;

export const FeeTransaction = TransactionBase.extend({
  type: z.literal("fee"),
  fee_type: z.enum(["network"]),
  network: z.enum(["blockchain"]),
  blockchain: z.object({
    hash: z.string(),
  }),
});
export type FeeTransaction = z.infer<typeof FeeTransaction>;

export const Transaction = z.discriminatedUnion("type", [
  PaymentTransaction,
  FeeTransaction,
]);
export type Transaction = z.infer<typeof Transaction>;

// ------------------------------------------------------------
export const remoteTransactionId = (
  tx: Pick<Transaction, "type" | "blockchain">
): string => {
  if (tx.type === "payment" || tx.type === "fee") {
    return tx.blockchain.hash;
  }

  throw new Error("Invalid transaction type");
};

export const transactionSortDesc = (a: Transaction, b: Transaction) =>
  b.created_at.getTime() - a.created_at.getTime();

const FINAL_STATES: TransactionStatus[] = [
  "completed",
  "failed",
  "canceled",
] as const;

export const isTransactionFinalized = (
  tx: Pick<Transaction, "status">
): boolean => {
  return FINAL_STATES.includes(tx.status);
};
