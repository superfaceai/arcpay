import { db, Pipeline } from "@/database";

import { Notification } from "./notification.entity";

const storageKeyById = ({
  accountId,
  live,
  id,
}: {
  accountId: string;
  live: boolean;
  id: string;
}) => `ntf:${accountId}:${live ? "live" : "test"}:${id}`;
const storageKeyByAccount = ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => `ntfs:${accountId}:${live ? "live" : "test"}`;

const saveNotificationViaPipeline = ({
  notification,
  accountId,
  pipeline,
}: {
  notification: Notification;
  accountId: string;
  pipeline: Pipeline;
}) => {
  pipeline
    .hset(
      storageKeyById({
        id: notification.id,
        accountId,
        live: notification.live,
      }),
      notification
    )
    .zadd(storageKeyByAccount({ accountId, live: notification.live }), {
      score: notification.created_at.getTime(),
      member: notification.id,
    });

  return pipeline;
};

export const saveNotification = async ({
  notification,
  accountId,
}: {
  notification: Notification;
  accountId: string;
}) => {
  const pipeline = db.multi();
  saveNotificationViaPipeline({ notification, accountId, pipeline });
  await pipeline.exec();

  return notification;
};

export const loadNotificationById = async ({
  accountId,
  notificationId,
  live,
}: {
  accountId: string;
  notificationId: string;
  live: boolean;
}): Promise<Notification | null> => {
  const notification = await db.hgetall<Notification>(
    storageKeyById({ id: notificationId, accountId, live })
  );

  if (!notification) {
    return null;
  }

  return Notification.parse(notification);
};

export const loadNotificationsByAccount = async ({
  accountId,
  live,
  from,
  to,
}: {
  accountId: string;
  live: boolean;
  from?: Date;
  to?: Date;
}): Promise<Notification[]> => {
  const notificationIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId, live }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const notifications = await Promise.all(
    notificationIds.map((notificationId) =>
      loadNotificationById({ accountId, notificationId, live })
    )
  );

  return notifications
    .filter((notification) => notification !== null)
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};

export const eraseNotificationsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const eraseNotifications = async ({ live }: { live: boolean }) => {
    const notificationIds = await db.zrange<string[]>(
      storageKeyByAccount({ accountId, live }),
      0,
      -1
    );

    const pipeline = db.pipeline();

    for (const notificationId of notificationIds) {
      pipeline.del(storageKeyById({ id: notificationId, accountId, live }));
      console.debug(
        `Removing Notification '${notificationId}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await eraseNotifications({ live: true });
  await eraseNotifications({ live: false });

  console.debug(`Removed Notifications for Account '${accountId}'`);
};
