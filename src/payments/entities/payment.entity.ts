import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Amount, Currency } from "@/balances/values";
import {
  PaymentMethodArcPay,
  PaymentMethodCrypto,
  PaymentMethodType,
} from "@/payments/values";

export const paymentId = () => generateId("pay");

export const PaymentStatus = z.enum(["pending", "succeeded", "failed"]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

const PaymentTriggerUser = z.object({
  method: z.literal("user"),
  // user_id: z.string(), when we have Users below Account
});
const PaymentTriggerCapture = z.object({
  method: z.literal("capture"),
});
export const PaymentTrigger = z.discriminatedUnion("method", [
  PaymentTriggerUser,
  PaymentTriggerCapture,
]);

const PaymentAuthorizationUser = z.object({
  method: z.literal("user"),
  // user_id: z.string(), when we have Users below Account
});
const PaymentAuthorizationMandate = z.object({
  method: z.literal("mandate"),
  mandate: z.string(),
});
export const PaymentAuthorization = z.discriminatedUnion("method", [
  PaymentAuthorizationUser,
  PaymentAuthorizationMandate,
]);

export const PaymentFee = z.object({
  type: z.enum(["network", "fx"]),
  amount: Amount,
  currency: Currency,
});
export type PaymentFee = z.infer<typeof PaymentFee>;

export const Payment = z.object({
  id: z.string(),
  live: z.boolean(),
  amount: Amount,
  currency: Currency,
  method: PaymentMethodType,
  crypto: PaymentMethodCrypto.optional(), // only when method=crypto
  arc_pay: PaymentMethodArcPay.optional(), // only when method=arc_pay
  fees: z.array(PaymentFee),
  status: PaymentStatus,
  trigger: PaymentTrigger,
  authorization: PaymentAuthorization,
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
