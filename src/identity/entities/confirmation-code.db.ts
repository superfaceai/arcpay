import { db } from "@/database";
import { ConfirmationCode } from "@/identity/entities/confirmation-code.entity";

const minute = 60 * 1000;

const storageKey = ({ code }: { code: number }) => `conf_code:${code}`;

export const saveConfirmationCode = async (
  confirmationCode: ConfirmationCode
) => {
  await db
    .multi()
    .set(storageKey({ code: confirmationCode.code }), confirmationCode)
    .expireat(
      storageKey({ code: confirmationCode.code }),
      Math.floor((confirmationCode.created_at.getTime() + minute) / 1000)
    )
    .exec();
  return confirmationCode;
};

export const loadConfirmationCodeByCode = async (
  code: number
): Promise<ConfirmationCode | null> => {
  const confirmationCode = await db.get<ConfirmationCode>(storageKey({ code }));

  if (!confirmationCode) {
    return null;
  }

  return ConfirmationCode.parse(confirmationCode);
};
