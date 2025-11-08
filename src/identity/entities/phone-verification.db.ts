import { db } from "@/database";
import { PhoneVerification } from "./phone-verification.entity";

const storageKeyByPhone = (phone: string) => `phv:${phone.replace(/\D/g, "")}`;

export const savePhoneVerification = async (
  phoneVerification: PhoneVerification
) => {
  await db.hset(storageKeyByPhone(phoneVerification.phone), phoneVerification);

  return phoneVerification;
};

export const loadPhoneVerification = async (phone: string) => {
  const phoneVerification = await db.hgetall<PhoneVerification>(
    storageKeyByPhone(phone)
  );
  return phoneVerification ? PhoneVerification.parse(phoneVerification) : null;
};

export const erasePhoneVerification = async ({
  phoneNumbers,
}: {
  phoneNumbers: string[];
}) => {
  for (const phone of phoneNumbers) {
    await db.del(storageKeyByPhone(phone));
    console.debug(`Removed Phone Verification for '${phone}'`);
  }
};
