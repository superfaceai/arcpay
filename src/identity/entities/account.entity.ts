import { generateId } from "@/lib";
import { z } from "zod";

import { Contact } from "./contact.entity";
import { Address, DEFAULT_MOCK_ADDRESSES } from "./address.entity";

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
  contacts: z.array(Contact).default([]),
  addresses: z.array(Address).default(DEFAULT_MOCK_ADDRESSES),
});
export type Account = z.infer<typeof Account>;
