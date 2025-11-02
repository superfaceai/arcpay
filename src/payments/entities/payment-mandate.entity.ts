import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Amount, Currency } from "@/balances/values";
import { PaymentMethodType } from "@/payments/values";
import { Account } from "@/identity/entities";

export const paymentMandateId = () => generateId("paym");

export const paymentMandateSecret = (mandateId: string) =>
  generateId(`${mandateId}_secret`, 128);

export const mandateIdFromSecret = (secret: string) =>
  secret.split("_secret_")[0];

export const PaymentMandateStatus = z.enum(["active", "inactive"]);
export type PaymentMandateStatus = z.infer<typeof PaymentMandateStatus>;

const PaymentMandateBase = z.object({
  id: z.string(),
  // type
  live: z.boolean(),
  status: PaymentMandateStatus,
  method: PaymentMethodType,
  // single_use
  // multi_use
  inactive_reason: z.enum(["expired", "used", "revoked"]).optional(),
  secret: z.string().min(128),
  on_behalf_of: Account.shape.id,
  merchant_id: z.string().optional(),
  created_at: DateCodec,
  expires_at: DateCodec.optional(),
  revoked_at: DateCodec.optional(),
  used_at: DateCodec.optional(),
  metadata: z.record(z.string(), z.string()),
});
const PaymentMandateSingleUse = PaymentMandateBase.extend({
  type: z.literal("single_use"),
  single_use: z.object({
    amount_limit: Amount,
    currency: Currency,
  }),
});
const PaymentMandateMultiUse = PaymentMandateBase.extend({
  type: z.literal("multi_use"),
  multi_use: z.object({
    amount_limit: Amount,
    total_amount_limit: Amount.optional(),
    usage_count_limit: z.number().optional(),
    currency: Currency,
  }),
});
export const PaymentMandate = z.discriminatedUnion("type", [
  PaymentMandateSingleUse,
  PaymentMandateMultiUse,
]);
export type PaymentMandate = z.infer<typeof PaymentMandate>;

export const paymentMandateSortDesc = (a: PaymentMandate, b: PaymentMandate) =>
  b.created_at.getTime() - a.created_at.getTime();
