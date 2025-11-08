import { z } from "zod";
import { generateId, PhoneNumber } from "@/lib";

export const contactId = () => generateId("ct");

const ContactBase = z.object({
  id: z.string(),
  label: z.string().optional(),
  verified: z.boolean().default(false),
});

export const ContactPhone = ContactBase.extend({
  method: z.literal(["phone"]),
  phone_number: PhoneNumber,
});
export const ContactEmail = ContactBase.extend({
  method: z.literal(["email"]),
  email: z.email(),
});

export const Contact = z.discriminatedUnion("method", [
  ContactPhone,
  ContactEmail,
]);
export type Contact = z.infer<typeof Contact>;
