import { db } from "@/database";
import { ContactVerification } from "./contact-verification.entity";

type KeyInput = { phone: string } | { email: string };

const storageKey = (input: KeyInput) => {
  const key =
    "phone" in input
      ? `ph_${input.phone.replace(/\D/g, "")}`
      : `eml_${input.email.trim()}`;

  return `ctv:${key}`;
};

export const saveContactVerification = async (
  contactVerification: ContactVerification
) => {
  if ("phone" in contactVerification) {
    await db.hset(
      storageKey({ phone: contactVerification.phone! }),
      contactVerification
    );
  } else {
    await db.hset(
      storageKey({ email: contactVerification.email! }),
      contactVerification
    );
  }

  return contactVerification;
};

export const loadContactVerification = async (input: KeyInput) => {
  const contactVerification = await db.hgetall<ContactVerification>(
    storageKey(input)
  );
  return contactVerification
    ? ContactVerification.parse(contactVerification)
    : null;
};

export const eraseContactVerifications = async ({
  phoneNumbers,
  emails,
}: {
  phoneNumbers: string[];
  emails: string[];
}) => {
  for (const phone of phoneNumbers) {
    await db.del(storageKey({ phone }));
    console.debug(`Removed Phone Verification for '${phone}'`);
  }
  for (const email of emails) {
    await db.del(storageKey({ email }));
    console.debug(`Removed Email Verification for '${email}'`);
  }
};
