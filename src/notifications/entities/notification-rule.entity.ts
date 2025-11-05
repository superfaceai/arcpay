import { z } from "zod";
import { DateCodec, generateId } from "@/lib";
import { Currency } from "@/balances/values/currency";
import { Amount } from "@/balances/values";

export const notificationRuleId = () => generateId("ntfr");

export const NotificationTriggerType = z.enum(["payment"]);
export type NotificationTriggerType = z.infer<typeof NotificationTriggerType>;

export const NotificationChannelSMS = z.literal("sms");
export const NotificationChannelEmail = z.literal("email");
export const NotificationChannel = z.union([
  NotificationChannelSMS,
  NotificationChannelEmail,
]);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

export const NotificationOnTransactionThreshold = z.object({
  // op: z.enum(["gt", "gte"]),
  amount: Amount,
  currency: Currency,
});

export const NotificationRule = z.object({
  id: z.string(),
  live: z.boolean(),
  enabled: z.boolean(),

  on: NotificationTriggerType,
  threshold: NotificationOnTransactionThreshold,

  deliver_to: z.array(
    z.object({
      channel: NotificationChannel,
      contact: z.string(),
    })
  ),
  created_at: DateCodec,
  enabled_since: DateCodec.optional(),
});
export type NotificationRule = z.infer<typeof NotificationRule>;
