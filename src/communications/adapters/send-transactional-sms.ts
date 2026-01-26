import { SendTransactionalSMS } from "@/communications/interfaces";
import { sendTransactionalSMS as mockSendTransactionalSMS } from "@/communications/mock/adapters";
import { client as twilioClient } from "@/communications/twilio/client";
import { sendTransactionalSMS as sendTransactionalSMSViaTwilio } from "@/communications/twilio/adapters";
import { client as unosendClient } from "@/communications/unosend/client";
import { sendTransactionalSMS as sendTransactionalSMSViaUnosend } from "@/communications/unosend/adapters";

export const sendTransactionalSMS: SendTransactionalSMS = async ({
  to,
  message,
}) => {
  if (unosendClient) return sendTransactionalSMSViaUnosend({ to, message });
  if (twilioClient) return sendTransactionalSMSViaTwilio({ to, message });
  return mockSendTransactionalSMS({ to, message });
};
