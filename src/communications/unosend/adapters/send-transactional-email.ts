import Config from "@/config";
import { err, ok } from "@/lib";

import { SendTransactionalEmail } from "@/communications/interfaces";
import { client } from "../client";

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  const from = Config.UNOSEND_FROM_EMAIL;

  if (!client || !from) {
    return err({
      type: "TransactionalEmailError",
      message: "Unosend email is not configured. Set UNOSEND_API_KEY and UNOSEND_FROM_EMAIL to a verified Unosend sender.",
    });
  }

  try {
    const response = await client.post("/emails", {
      from,
      to,
      subject,
      html: `<p>${escapeHtml(plainTextMessage)}</p>`,
    });

    if (!response.ok) {
      const responseBody = await response.text().catch(() => "");
      return err({
        type: "TransactionalEmailError",
        message: `Failed to send email via Unosend from ${from}: ${response.status} ${response.statusText}${
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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
