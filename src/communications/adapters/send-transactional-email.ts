import { SendTransactionalEmail } from "@/communications/interfaces";

import { sendTransactionalEmail as sendTransactionalEmailViaSendgrid } from "@/communications/sendgrid/adapters";

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  return sendTransactionalEmailViaSendgrid({ to, subject, plainTextMessage });
};
