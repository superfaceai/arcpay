import Config from "@/config";
import { err, ok } from "@/lib";

import { SendTransactionalEmail } from "@/communications/interfaces";
import { sendTransactionalEmail as mockSendTransactionalEmail } from "@/communications/mock/adapters";
import { client } from "../client";

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  if (!client)
    return mockSendTransactionalEmail({ to, subject, plainTextMessage });

  try {
    const msg = {
      to,
      from: Config.SENDGRID_FROM_EMAIL!, // if thre is a client, there is a from email
      subject,
      text: plainTextMessage,
    };

    await client.send(msg);

    return ok({ status: "sent" });
  } catch (error) {
    return err({
      type: "TransactionalEmailError",
      message: String(error),
    });
  }
};
