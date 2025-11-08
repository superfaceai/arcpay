import { DateCodec, generateId, PhoneNumber } from "@/lib";
import { z } from "zod";

export const phoneVerificationSecret = (phone: string) =>
  generateId(`phv_secret_${phone.replace(/\D/g, "")}`, 64);

export const PhoneVerification = z.object({
  phone: PhoneNumber,
  secret: z.string().min(64),
  last_verified_at: DateCodec,
});

export type PhoneVerification = z.infer<typeof PhoneVerification>;
