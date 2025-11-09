import { db } from "@/database";
import { ConfirmationCode } from "@/identity/entities/confirmation-code.entity";
import { MINUTE } from "@/lib";

const EMAIL_CODE_EXPIRATION_TIME = 2 * MINUTE;
const PHONE_CODE_EXPIRATION_TIME = 1 * MINUTE;

const storageKey = ({ code }: { code: number }) => `conf_code:${code}`;

export const saveConfirmationCode = async (
  confirmationCode: ConfirmationCode
) => {
  const expirationTime = confirmationCode.phone
    ? PHONE_CODE_EXPIRATION_TIME
    : EMAIL_CODE_EXPIRATION_TIME;

  await db
    .multi()
    .set(storageKey({ code: confirmationCode.code }), confirmationCode)
    .expireat(
      storageKey({ code: confirmationCode.code }),
      Math.floor(
        (confirmationCode.created_at.getTime() + expirationTime) / 1000
      )
    )
    .exec();
  return confirmationCode;
};

export const loadConfirmationCode = async (
  code: number
): Promise<ConfirmationCode | null> => {
  const confirmationCode = await db.get<ConfirmationCode>(storageKey({ code }));

  if (!confirmationCode) {
    return null;
  }

  return ConfirmationCode.parse(confirmationCode);
};

export const deleteConfirmationCode = async (code: number): Promise<void> => {
  await db.del(storageKey({ code }));
};
