import { z } from "zod";
import { err, ok, Result } from "@/lib";

import {
  Account,
  deleteConfirmationCode,
  loadAccountByPhone,
  loadConfirmationCode,
  PhoneVerification,
  phoneVerificationSecret,
  savePhoneVerification,
} from "@/identity/entities";

import { CodeConfirmationError } from "@/identity/errors";

export const ConfirmCodeDTO = z.object({
  code: z.number(),
});

type ConfirmCodeOutcome =
  | {
      next: "login";
      account: Account;
    }
  | {
      next: "registration";
      phoneVerification: PhoneVerification;
    };

export const confirmCode = async (
  dto: z.infer<typeof ConfirmCodeDTO>
): Promise<Result<ConfirmCodeOutcome, CodeConfirmationError>> => {
  const confirmationCode = await loadConfirmationCode(dto.code);
  await deleteConfirmationCode(dto.code);

  if (!confirmationCode) {
    return err({
      type: "CodeConfirmationError",
      message: "The confirmation code is invalid or has expired",
    });
  }

  const phoneVerification: PhoneVerification = {
    phone: confirmationCode.phone,
    secret: phoneVerificationSecret(confirmationCode.phone),
    last_verified_at: new Date(),
  };
  await savePhoneVerification(phoneVerification);
  const account = await loadAccountByPhone(confirmationCode.phone);

  if (account) {
    return ok({
      next: "login",
      account,
    });
  }

  return ok({
    next: "registration",
    phoneVerification,
  });
};
