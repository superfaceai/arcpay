import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import {
  Amount,
  Currency,
  PaymentMethodCrypto,
  PaymentMethodType,
} from "@/payments/values";

export const paymentId = () => generateId("pay");

export const PaymentStatus = z.enum(["pending", "succeeded", "failed"]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PaymentFee = z.object({
  type: z.enum(["network", "fx"]),
  amount: Amount,
  currency: Currency,
});
export type PaymentFee = z.infer<typeof PaymentFee>;

export const Payment = z.object({
  id: z.string(),
  amount: Amount,
  currency: Currency,
  method: PaymentMethodType,
  crypto: PaymentMethodCrypto.optional(), // only when method=crypto
  fees: z.array(PaymentFee),
  status: PaymentStatus,
  live: z.boolean(),
  failure_reason: z.string().optional(),
  created_at: DateCodec,
  finished_at: DateCodec.optional(),
});
export type Payment = z.infer<typeof Payment>;

const FINAL_STATES: PaymentStatus[] = ["succeeded", "failed"] as const;

export const isPaymentFinalized = (
  payment: Pick<Payment, "status">
): boolean => {
  return FINAL_STATES.includes(payment.status);
};

export const paymentSortDesc = (a: Payment, b: Payment) =>
  b.created_at.getTime() - a.created_at.getTime();
