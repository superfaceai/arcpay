import { ok } from "@/lib";

import { SendTransactionalSMS } from "@/communications/interfaces";

export const sendTransactionalSMS: SendTransactionalSMS = async ({
  to,
  message,
}) => {
  console.error(`[SMS MOCK] [${to}] ${message}`);
  return ok({ status: "failed" });
};
