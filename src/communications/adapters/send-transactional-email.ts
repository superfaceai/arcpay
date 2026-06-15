import Config from "@/config";
import { SendTransactionalEmail } from "@/communications/interfaces";

import { sendTransactionalEmail as sendTransactionalEmailViaSendgrid } from "@/communications/sendgrid/adapters";
import { sendTransactionalEmail as sendTransactionalEmailViaUnosend } from "@/communications/unosend/adapters";

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

  return sendTransactionalEmailViaSendgrid({ to, subject, plainTextMessage });
};
