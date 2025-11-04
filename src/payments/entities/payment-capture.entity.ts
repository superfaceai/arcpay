import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Amount, Currency } from "@/balances/values";
import { PaymentMetadata, PaymentMethodType } from "@/payments/values";

import { PaymentMandateSecret } from "./payment-mandate.entity";

export const paymentCaptureId = () => generateId("payc");

export const PaymentCaptureStatus = z.enum([
  "requires_capture",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
]);
export type PaymentCaptureStatus = z.infer<typeof PaymentCaptureStatus>;

const PaymentCaptureAuthorizationSender = z.object({
  method: z.literal("sender"),
});
const PaymentCaptureAuthorizationMandate = z.object({
  method: z.literal("mandate"),
  granted_mandate_secret: PaymentMandateSecret,
});

export const PaymentCaptureAuthorization = z.discriminatedUnion("method", [
  PaymentCaptureAuthorizationSender,
  PaymentCaptureAuthorizationMandate,
]);
export type PaymentCaptureAuthorization = z.infer<
  typeof PaymentCaptureAuthorization
>;

export const PaymentCapture = z.object({
  id: z.string(),
  live: z.boolean(),
  amount: Amount,
  currency: Currency,
  method: PaymentMethodType,
  status: PaymentCaptureStatus,
  authorization: PaymentCaptureAuthorization,
  cancellation_reason: z.string().optional(),
  cancelled_at: DateCodec.optional(),
  failure_reason: z.string().optional(),
  failed_at: DateCodec.optional(),
  finished_at: DateCodec.optional(),
  created_at: DateCodec,
  metadata: PaymentMetadata.optional(),
});

export type PaymentCapture = z.infer<typeof PaymentCapture>;

export const paymentCaptureSortDesc = (a: PaymentCapture, b: PaymentCapture) =>
  b.created_at.getTime() - a.created_at.getTime();
