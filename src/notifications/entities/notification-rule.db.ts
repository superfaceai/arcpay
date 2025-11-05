import { db } from "@/database";

import { NotificationRule } from "./notification-rule.entity";

const storageKeyById = ({
  accountId,
  live,
  id,
}: {
  accountId: string;
  live: boolean;
  id: string;
}) => `ntfr:${accountId}:${live ? "live" : "test"}:${id}`;

export const saveNotificationRule = async ({
  notificationRule,
  accountId,
}: {
  notificationRule: NotificationRule;
  accountId: string;
}) => {
  await db.hset(
    storageKeyById({
      accountId,
      live: notificationRule.live,
      id: notificationRule.id,
    }),
    notificationRule
  );
};

export const loadNotificationRulesByAccount = async ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}): Promise<NotificationRule[]> => {
  const pattern = storageKeyById({ accountId, live, id: "*" });

  let cursor = "0";
  const allKeys: string[] = [];

  do {
    const [nextCursor, keys] = await db.scan(cursor, {
      match: pattern,
      count: 100_000,
    });
    if (Array.isArray(keys) && keys.length > 0) {
      allKeys.push(...keys);
    }
    cursor = nextCursor;
  } while (cursor !== "0");

  if (allKeys.length === 0) return [];

  const notificationRulesPipeline = db.pipeline();
  for (const key of allKeys) {
    notificationRulesPipeline.hgetall<NotificationRule>(key);
  }
  const notificationRulesRaw = await notificationRulesPipeline.exec<
    NotificationRule[]
  >();

  return notificationRulesRaw
    .filter((notificationRule) => !!notificationRule)
    .map((notificationRule) => NotificationRule.parse(notificationRule))
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};
