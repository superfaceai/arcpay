import Config from "@/config";
import { err } from "@/lib";
import { SendTransactionalEmail } from "@/communications/interfaces";

import { sendTransactionalEmail as sendTransactionalEmailViaSendgrid } from "@/communications/sendgrid/adapters";
import { sendTransactionalEmail as sendTransactionalEmailViaUnosend } from "@/communications/unosend/adapters";

console.info(
  `[communications] transactional email providers: unosend=${
    Config.UNOSEND_API_KEY ? "configured" : "unconfigured"
  }, sendgrid=${
    Config.SENDGRID_API_KEY && Config.SENDGRID_FROM_EMAIL
      ? "configured"
      : "unconfigured"
  }`,
);

export const sendTransactionalEmail: SendTransactionalEmail = async ({
  to,
  subject,
  plainTextMessage,
}) => {
  const failures: string[] = [];

  if (Config.UNOSEND_API_KEY) {
    const unosendResult = await sendTransactionalEmailViaUnosend({
      to,
      subject,
      plainTextMessage,
    });

    if (unosendResult.ok) return unosendResult;

    failures.push(`Unosend: ${unosendResult.error.message}`);
    console.warn("Failed to send transactional email via Unosend", {
      to,
      error: unosendResult.error,
    });
  } else {
    failures.push("Unosend: unconfigured");
  }

  if (Config.SENDGRID_API_KEY && Config.SENDGRID_FROM_EMAIL) {
    const sendgridResult = await sendTransactionalEmailViaSendgrid({
      to,
      subject,
      plainTextMessage,
    });

    if (sendgridResult.ok) return sendgridResult;

    failures.push(`SendGrid: ${sendgridResult.error.message}`);
    console.warn("Failed to send transactional email via SendGrid", {
      to,
      error: sendgridResult.error,
    });
  } else {
    failures.push("SendGrid: unconfigured");
  }

  console.error(
    `[EMAIL UNSENT] [${to}] [${subject}] ${plainTextMessage}`,
  );

  return err({
    type: "TransactionalEmailError",
    message: `Failed to send transactional email. ${failures.join("; ")}`,
  });
};
