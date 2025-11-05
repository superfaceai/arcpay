import Config from "@/config";
import { err, ok } from "@/lib";

import { SendTransactionalSMS } from "@/communications/interfaces";
import { sendTransactionalSMS as mockSendTransactionalSMS } from "@/communications/mock/adapters";
import { client, TwilioMessage } from "../client";

export const sendTransactionalSMS: SendTransactionalSMS = async ({
  to,
  message,
}) => {
  if (!client) return mockSendTransactionalSMS({ to, message });

  try {
    const twilioMessage = await client.messages.create({
      from: Config.TWILIO_PHONE_NUMBER,
      to,
      body: message,
    });

    return ok({ status: TWILIO_STATUS_MAPPING[twilioMessage.status] });
  } catch (error) {
    return err({
      type: "TransactionalSMSError",
      message: String(error),
    });
  }
};

const TWILIO_STATUS_MAPPING: Record<
  TwilioMessage["status"],
  "sent" | "failed"
> = {
  queued: "sent",
  sent: "sent",
  sending: "sent",
  receiving: "sent",
  scheduled: "sent",
  partially_delivered: "sent",
  accepted: "sent",
  delivered: "sent",
  received: "sent",
  read: "sent",
  canceled: "failed",
  failed: "failed",
  undelivered: "failed",
};
