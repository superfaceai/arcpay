import { z } from "zod";
import { generateId, DateCodec } from "@/lib/index.js";
import { Amount } from "../values/amount.js";
import { Currency } from "../values/currency.js";

export const transactionId = () => generateId("tx");

export const TransactionStatus = z.enum([
  "queued",
  "sent",
  "confirmed",
  "completed",
  "failed",
  "canceled",
]);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const Transaction = z.object({
  id: z.string(),
  status: TransactionStatus,
  amount: Amount,
  currency: Currency,
  fees: z.array(
    z.object({
      type: z.enum(["network", "fx"]),
      amount: Amount,
      currency: Currency,
    })
  ),
  counterparty: z.string(),
  blockchain: z
    .object({
      hash: z.string().optional(),
      explorer_url: z.url().optional(),
    })
    .optional(),
  processor: z
    .object({
      name: z.enum(["circle"]),
      id: z.string(),
      state: z.string(),
    })
    .optional(),
  created_at: DateCodec,
  fingerprint: z.uuidv4().optional(),
});

export type Transaction = z.infer<typeof Transaction>;

export const transactionSortDesc = (a: Transaction, b: Transaction) =>
  b.created_at.getTime() - a.created_at.getTime();
