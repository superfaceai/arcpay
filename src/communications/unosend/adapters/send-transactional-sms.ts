import { err, ok } from "@/lib";

import { SendTransactionalSMS } from "@/communications/interfaces";
import { sendTransactionalSMS as mockSendTransactionalSMS } from "@/communications/mock/adapters";
import { client, UnosendMessageResult } from "../client";

export const sendTransactionalSMS: SendTransactionalSMS = async ({
  to,
  message,
}) => {
  if (!client) return mockSendTransactionalSMS({ to, message });

  try {
    const response = await client.post("/sms", {
      from: "ArcPay", // Sender ID (1-11 characters) might not be supported in the recipient's country
      to,
      body: message,
    });

    if (!response.ok) return err({
      type: "TransactionalSMSError",
      message: `Failed to send SMS: ${response.statusText}`,
    });

    const result: {data: UnosendMessageResult[]} = await response.json();
    
    return ok({ 
      status: UNOSEND_STATUS_MAPPING[result.data[0].status] 
    });
  } catch (error) {
    return err({
      type: "TransactionalSMSError",
      message: String(error),
    });
  }
};

const UNOSEND_STATUS_MAPPING: Record<
  UnosendMessageResult["status"],
  "sent" | "failed"
> = {
  sent: "sent",
  queued: "sent",
  failed: "failed",
};
