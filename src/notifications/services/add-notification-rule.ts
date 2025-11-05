import { z } from "zod";
import { err, ok, Result } from "@/lib";

import { loadAccountById } from "@/identity/entities";
import {
  NotificationOnTransactionThreshold,
  NotificationRule,
  notificationRuleId,
  NotificationTriggerType,
  saveNotificationRule,
} from "@/notifications/entities";
import { InvalidNotificationRuleError } from "@/notifications/errors";

export const AddNotificationRuleDTO = z.object({
  on: NotificationTriggerType,
  threshold: NotificationOnTransactionThreshold,
  deliver_to: z.union([z.string(), z.array(z.string())]),
});

export const addNotificationRule = async ({
  live,
  accountId,
  dto,
}: {
  live: boolean;
  accountId: string;
  dto: z.infer<typeof AddNotificationRuleDTO>;
}): Promise<Result<NotificationRule, InvalidNotificationRuleError>> => {
  const account = (await loadAccountById(accountId))!;

  const newDeliveryTargets: NotificationRule["deliver_to"] = [];

  const dtoDeliveryTargets = Array.isArray(dto.deliver_to)
    ? dto.deliver_to
    : [dto.deliver_to];

  for (const deliverTo of dtoDeliveryTargets) {
    const contact = account.contacts.find((c) => c.id === deliverTo);
    if (!contact) {
      return err({
        type: "InvalidNotificationRuleError",
        message: `Contact '${deliverTo}' does not exist`,
      });
    }

    newDeliveryTargets.push({
      channel: contact.method === "phone" ? "sms" : "email",
      contact: contact.id,
    });
  }

  const newNotificationRule: NotificationRule = {
    id: notificationRuleId(),
    live,
    enabled: true,
    on: dto.on,
    threshold: dto.threshold,
    deliver_to: newDeliveryTargets,
    created_at: new Date(),
  };

  await saveNotificationRule({
    notificationRule: newNotificationRule,
    accountId,
  });

  return ok(newNotificationRule);
};
