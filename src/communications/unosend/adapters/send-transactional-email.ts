import Config from "@/config";
import { err, ok } from "@/lib";

import { SendTransactionalEmail } from "@/communications/interfaces";
import { client } from "../client";

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  const from = Config.UNOSEND_FROM_EMAIL ?? Config.SENDGRID_FROM_EMAIL;

  if (!client || !from) {
    return err({
      type: "TransactionalEmailError",
      message: "Unosend email is not configured",
    });
  }

  try {
    const response = await client.post("/emails", {
      from,
      to: [to],
      subject,
      text: plainTextMessage,
      priority: "high",
      tracking: {
        open: false,
        click: false,
      },
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      return err({
        type: "TransactionalEmailError",
        message: `Failed to send email via Unosend: ${response.status} ${response.statusText}${
          responseBody ? ` - ${responseBody}` : ""
        }`,
      });
    }

    return ok({ status: "sent" });
  } catch (error) {
    return err({
      type: "TransactionalEmailError",
      message: String(error),
    });
  }
};
