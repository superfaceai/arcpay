import { ok } from "@/lib";

import { SendTransactionalEmail } from "@/communications/interfaces";

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  console.error(`[EMAIL MOCK] [${to}] [${subject}] ${plainTextMessage}`);
  return ok({ status: "failed" });
};
