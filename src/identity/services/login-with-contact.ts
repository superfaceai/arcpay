import { z } from "zod";
import { ok, PhoneNumber, Result } from "@/lib";

import {
  ConfirmationCode,
  generateConfirmationCode,
  loadConfirmationCode,
  saveConfirmationCode,
} from "@/identity/entities";

import {
  SendTransactionalEmail,
  SendTransactionalSMS,
} from "@/communications/interfaces";
import { sendTransactionalSMS } from "@/communications/twilio/adapters";
import { sendTransactionalEmail } from "@/communications/sendgrid/adapters";

const LoginWithPhone = z.object({
  phone: PhoneNumber,
});
const LoginWithEmail = z.object({
  email: z.email(),
});
export const LoginWithContactDTO = z.union([LoginWithPhone, LoginWithEmail]);

export const loginWithContact = async (
  dto: z.infer<typeof LoginWithContactDTO>,
  sendTransactionalSMSAdapter: SendTransactionalSMS = sendTransactionalSMS,
  sendTransactionalEmailAdapter: SendTransactionalEmail = sendTransactionalEmail
): Promise<Result<ConfirmationCode, void>> => {
  const code = await generateAvailableConfirmationCode();

  const confirmationCode = ConfirmationCode.parse({
    code,
    ...("phone" in dto ? { phone: dto.phone } : {}),
    ...("email" in dto ? { email: dto.email } : {}),
    created_at: new Date(),
  });
  await saveConfirmationCode(confirmationCode);

  if ("phone" in dto) {
    await sendTransactionalSMSAdapter({
      to: dto.phone,
      message: `Your login code to Arc Pay is ${confirmationCode.code}`,
    });
  }

  if ("email" in dto) {
    await sendTransactionalEmailAdapter({
      to: dto.email,
      subject: "Your login code to Arc Pay",
      plainTextMessage: `Your login code to Arc Pay is ${confirmationCode.code}`,
    });
  }

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
