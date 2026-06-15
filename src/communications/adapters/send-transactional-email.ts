import Config from "@/config";
import { err } from "@/lib";
import { SendTransactionalEmail } from "@/communications/interfaces";

import { sendTransactionalEmail as mockSendTransactionalEmail } from "@/communications/mock/adapters";
import { sendTransactionalEmail as sendTransactionalEmailViaSendgrid } from "@/communications/sendgrid/adapters";
import { sendTransactionalEmail as sendTransactionalEmailViaUnosend } from "@/communications/unosend/adapters";

const transactionalEmailProvider = Config.UNOSEND_API_KEY
  ? "unosend"
  : Config.SENDGRID_API_KEY && Config.SENDGRID_FROM_EMAIL
  ? "sendgrid"
  : Config.IS_PRODUCTION
  ? "none"
  : "mock";

console.info(
  `[communications] transactional email provider: ${transactionalEmailProvider}`,
);

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  if (Config.UNOSEND_API_KEY) {
    return sendTransactionalEmailViaUnosend({
      to,
      subject,
      plainTextMessage,
    });
  }

  if (Config.SENDGRID_API_KEY && Config.SENDGRID_FROM_EMAIL) {
    return sendTransactionalEmailViaSendgrid({
      to,
      subject,
      plainTextMessage,
    });
  }

  if (!Config.IS_PRODUCTION) {
    return mockSendTransactionalEmail({ to, subject, plainTextMessage });
  }

  return err({
    type: "TransactionalEmailError",
    message: "No transactional email provider is configured",
  });
};
