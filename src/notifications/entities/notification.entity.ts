import { z } from "zod";
import { DateCodec, generateId, PhoneNumber } from "@/lib";
import {
  NotificationChannelEmail,
  NotificationChannelSMS,
  NotificationRule,
  NotificationTriggerType,
} from "./notification-rule.entity";

export const notificationId = () => generateId("ntf");

export const NotificationStatus = z.enum(["queued", "sent", "failed"]);
export type NotificationStatus = z.infer<typeof NotificationStatus>;

const NotificationDestinationSMS = z.object({
  channel: NotificationChannelSMS,
  phone_number: PhoneNumber,
});
const NotificationDestinationEmail = z.object({
  channel: NotificationChannelEmail,
  email: z.email(),
});
export const NotificationDestination = z.discriminatedUnion("channel", [
  NotificationDestinationSMS,
  NotificationDestinationEmail,
]);

export const NotificationTrigger = z.object({
  type: NotificationTriggerType,
  payment: z.string(),
});

export const Notification = z.object({
  id: z.string(),
  rule: NotificationRule.shape.id,
  live: z.boolean(),
  event: NotificationTrigger,
  destination: NotificationDestination,
  message: z.string(),
  status: NotificationStatus,
  created_at: DateCodec,
});
export type Notification = z.infer<typeof Notification>;
