import { Notification, saveNotification } from "@/notifications/entities";

import {
  SendTransactionalSMS,
  SendTransactionalEmail,
} from "@/communications/interfaces";
import { sendTransactionalSMS } from "@/communications/twilio/adapters";
import { sendTransactionalEmail } from "@/communications/mock/adapters";

export const deliverNotification = async ({
  accountId,
  notification,
  sendTransactionalSMSAdapter = sendTransactionalSMS,
  sendTransactionalEmailAdapter = sendTransactionalEmail,
}: {
  accountId: string;
  notification: Notification;
  sendTransactionalSMSAdapter?: SendTransactionalSMS;
  sendTransactionalEmailAdapter?: SendTransactionalEmail;
}): Promise<void> => {
  switch (notification.destination.channel) {
    case "sms": {
      const sentResult = await sendTransactionalSMSAdapter({
        to: notification.destination.phone_number,
        message: notification.message,
      });
      if (!sentResult.ok) {
        console.error(
          `[${notification.id}] Failed to send SMS: ${JSON.stringify(sentResult.error)}`
        );
      }
      await saveNotification({
        accountId,
        notification: {
          ...notification,
          status: !sentResult.ok ? "failed" : sentResult.value.status,
        },
      });
      break;
    }

    case "email": {
      const sentResult = await sendTransactionalEmailAdapter({
        to: notification.destination.email,
        subject: notification.subject,
        plainTextMessage: notification.message,
      });
      if (!sentResult.ok) {
        console.error(
          `[${notification.id}] Failed to send email: ${JSON.stringify(sentResult.error)}`
        );
      }
      await saveNotification({
        accountId,
        notification: {
          ...notification,
          status: !sentResult.ok ? "failed" : sentResult.value.status,
        },
      });
      break;
    }
    default: {
      console.error(`Unknown notification channel: ${notification}`);
      break;
    }
  }
};
