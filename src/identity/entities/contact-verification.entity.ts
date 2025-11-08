import { DateCodec, generateId, PhoneNumber } from "@/lib";
import { z } from "zod";

export const contactVerificationSecret = (type: "phone" | "email") => {
  const method = type === "phone" ? `ph` : `eml`;

  return generateId(`ctv_secret_${method}`, 64);
};

export const ContactVerification = z.object({
  // Only one of phone or email should be present
  phone: PhoneNumber.optional(),
  email: z.email().optional(),
  secret: z.string().min(64),
  last_verified_at: DateCodec,
});

export type ContactVerification = z.infer<typeof ContactVerification>;
