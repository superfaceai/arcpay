import { ok } from "@/lib";

import { SendTransactionalEmail } from "@/communications/interfaces";

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  plainTextMessage,
}) => {
  console.error(`[EMAIL MOCK] [${to}] ${plainTextMessage}`);
  return ok({ status: "failed" });
};
