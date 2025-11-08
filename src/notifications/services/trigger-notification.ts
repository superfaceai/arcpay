import { z } from "zod";
import Big from "big.js";

import { Contact, loadAccountById } from "@/identity/entities";
import { Payment } from "@/payments/entities";

import {
  loadNotificationRulesByAccount,
  notificationId,
  NotificationRule,
  Notification,
  NotificationTriggerType,
  NotificationChannel,
  saveManyNotifications,
} from "@/notifications/entities";

import { deliverNotification } from "./deliver-notification";

export const TriggerNotificationEvent = z.object({
  type: NotificationTriggerType,
  payment: Payment,
});

export const triggerNotification = async ({
  live,
  accountId,
  event,
}: {
  live: boolean;
  accountId: string;
  event: z.infer<typeof TriggerNotificationEvent>;
}): Promise<void> => {
  const notificationRules = await loadNotificationRulesByAccount({
    accountId,
    live,
  });
  if (notificationRules.length === 0) return;

  const matchingNotificationRules = notificationRules.filter((rule) =>
    matchNotificationRule(rule, event)
  );
  const account = (await loadAccountById(accountId))!;

  const notifications = createNotifications(
    matchingNotificationRules,
    event,
    account.contacts
  );

  await saveManyNotifications({
    notifications,
    accountId,
  });

  for (const notification of notifications) {
    await deliverNotification({ accountId, notification });
  }

  return;
};

const createNotifications = (
  rules: NotificationRule[],
  event: z.infer<typeof TriggerNotificationEvent>,
  contacts: Contact[]
): Notification[] => {
  const notifications: Notification[] = [];

  for (const rule of rules) {
    for (const delivery of rule.deliver_to) {
      const contactMethod: Contact["method"] =
        delivery.channel === "sms" ? "phone" : "email";

      const contact = contacts.find(
        (c) => c.id === delivery.contact && c.method === contactMethod
      );
      if (!contact) continue;

      const destination: Notification["destination"] =
        contact.method === "phone"
          ? {
              channel: "sms",
              phone_number: contact.phone_number,
            }
          : {
              channel: "email",
              email: contact.email,
            };

      const { subject, message } = generateNotificationMessage({
        channel: destination.channel,
        event,
      });

      const notification: Notification = {
        id: notificationId(),
        rule: rule.id,
        live: rule.live,
        event: {
          type: rule.on,
          payment: event.payment.id,
        },
        destination,
        subject,
        message,
        status: "queued",
        created_at: new Date(),
      };

      notifications.push(notification);
    }
  }

  return notifications;
};

const generateNotificationMessage = ({
  channel,
  event,
}: {
  channel: NotificationChannel;
  event: z.infer<typeof TriggerNotificationEvent>;
}): { subject: string; message: string } => {
  // TODO: Generate message based on channel

  const beneficiary =
    (event.payment.method === "crypto"
      ? event.payment.crypto?.address
      : event.payment.arcpay?.account) ?? "unknown";

  const method = event.payment.method === "crypto" ? "crypto" : "Arc Pay";

  return {
    subject: `New ${method} payment sent`,
    message: `You paid ${event.payment.amount} ${event.payment.currency} to '${beneficiary}'`,
  };
};

const matchNotificationRule = (
  rule: NotificationRule,
  event: z.infer<typeof TriggerNotificationEvent>
): boolean => {
  if (rule.on !== event.type) return false;

  switch (event.type) {
    case "payment": {
      // TODO: Handle potential currency conversion!
      const isOverThreshold = Big(event.payment.amount).gte(
        rule.threshold.amount
      );

      return isOverThreshold;
    }
    default:
      return false;
  }
};
