import { z } from "zod";
import { ok, PhoneNumber, Result } from "@/lib";

import {
  ConfirmationCode,
  generateConfirmationCode,
  saveConfirmationCode,
} from "@/identity/entities";

import { SendTransactionalSMS } from "@/communications/interfaces";
import { sendTransactionalSMS } from "@/communications/twilio/adapters";

export const LoginViaPhoneDTO = z.object({
  phone: PhoneNumber,
});

export const loginViaPhone = async (
  dto: z.infer<typeof LoginViaPhoneDTO>,
  sendTransactionalSMSAdapter: SendTransactionalSMS = sendTransactionalSMS
): Promise<Result<ConfirmationCode, void>> => {
  const confirmationCode = ConfirmationCode.parse({
    code: generateConfirmationCode(),
    phone: dto.phone,
    created_at: new Date(),
  });

  await saveConfirmationCode(confirmationCode);
  await sendTransactionalSMSAdapter({
    to: dto.phone,
    message: `Your login code to Arc Pay is ${confirmationCode.code}`,
  });

  return ok(confirmationCode);
};
