import { z } from "zod";
import { ok, PhoneNumber, Result } from "@/lib";

import {
  ConfirmationCode,
  generateConfirmationCode,
  loadConfirmationCode,
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
  const code = await generateAvailableConfirmationCode();

  const confirmationCode = ConfirmationCode.parse({
    code,
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

export const generateAvailableConfirmationCode = async (): Promise<number> => {
  while (true) {
    const code = generateConfirmationCode();
    const confirmationCode = await loadConfirmationCode(code);

    if (!confirmationCode) {
      return code;
    }
  }
};
