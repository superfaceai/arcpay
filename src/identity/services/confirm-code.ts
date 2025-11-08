import { z } from "zod";
import { err, ok, Result } from "@/lib";

import {
  Account,
  deleteConfirmationCode,
  loadAccountByPhone,
  loadConfirmationCode,
  contactVerificationSecret,
  ContactVerification,
  saveContactVerification,
  loadAccountByEmail,
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
      contactVerification: ContactVerification;
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

  const contactVerification: ContactVerification = {
    ...(confirmationCode.phone ? { phone: confirmationCode.phone } : {}),
    ...(confirmationCode.email ? { email: confirmationCode.email } : {}),
    secret: contactVerificationSecret("phone"),
    last_verified_at: new Date(),
  };
  await saveContactVerification(contactVerification);

  const account = confirmationCode.phone
    ? await loadAccountByPhone(confirmationCode.phone)
    : confirmationCode.email
    ? await loadAccountByEmail(confirmationCode.email)
    : undefined;

  if (account) {
    return ok({
      next: "login",
      account,
    });
  }

  return ok({
    next: "registration",
    contactVerification,
  });
};
