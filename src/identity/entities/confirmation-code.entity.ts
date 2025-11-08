import { DateCodec, PhoneNumber } from "@/lib";
import { z } from "zod";

export const generateConfirmationCode = () =>
  Math.floor(100000 + Math.random() * 900000);

export const ConfirmationCode = z.object({
  code: z.number(),
  phone: PhoneNumber.optional(),
  email: z.email().optional(),
  created_at: DateCodec,
});

export type ConfirmationCode = z.infer<typeof ConfirmationCode>;
