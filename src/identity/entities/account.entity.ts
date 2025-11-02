import { generateId } from "@/lib";
import { z } from "zod";

export const accountId = () => generateId("acct");

export const AccountHandle = z
  .string()
  .min(3)
  .regex(/^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/);
export type AccountHandle = z.infer<typeof AccountHandle>;

export const Account = z.object({
  id: z.string(),
  type: z.enum(["individual"]),
  name: z.string().min(3),
  handle: AccountHandle,
});
export type Account = z.infer<typeof Account>;
