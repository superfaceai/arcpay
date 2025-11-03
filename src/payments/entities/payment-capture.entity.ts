import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Amount, Currency } from "@/balances/values";
import {
  PaymentMetadata,
  PaymentMethodAgentPay,
  PaymentMethodCrypto,
  PaymentMethodType,
} from "@/payments/values";

import { PaymentMandateSecret } from "./payment-mandate.entity";

export const paymentCaptureId = () => generateId("payc");

export const PaymentCaptureStatus = z.enum([
  "requires_capture",
  "processing",
  "succeeded",
  "cancelled",
]);
export type PaymentCaptureStatus = z.infer<typeof PaymentCaptureStatus>;

export const PaymentCapture = z.object({
  id: z.string(),
  live: z.boolean(),
  amount: Amount,
  currency: Currency,
  method: PaymentMethodType,
  status: PaymentCaptureStatus,
  granted_mandate_secret: PaymentMandateSecret.optional(),
  cancellation_reason: z.string().optional(),
  cancelled_at: DateCodec.optional(),
  created_at: DateCodec,
  metadata: PaymentMetadata.optional(),
});

export type PaymentCapture = z.infer<typeof PaymentCapture>;

export const paymentCaptureSortDesc = (a: PaymentCapture, b: PaymentCapture) =>
  b.created_at.getTime() - a.created_at.getTime();
