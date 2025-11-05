import { Notification, saveNotification } from "@/notifications/entities";

export const deliverNotification = async ({
  accountId,
  notification,
}: {
  accountId: string;
  notification: Notification;
}): Promise<void> => {
  const sentNotification: Notification = {
    ...notification,
    status: "sent",
  };

  switch (notification.destination.channel) {
    case "sms": {
      // TODO: Deliver notification via SMS
      console.info(
        `[SMS] [${notification.destination.phone_number}] ${notification.message}`
      );
      await saveNotification({ accountId, notification: sentNotification });
      break;
    }
    case "email": {
      // TODO: Deliver notification via Email
      console.info(
        `[Email] [${notification.destination.email}] ${notification.message}`
      );
      await saveNotification({ accountId, notification: sentNotification });
      break;
    }
    default: {
      console.error(`Unknown notification channel: ${notification}`);
      break;
    }
  }
};
