import { generateId } from "@/lib";
import { z } from "zod";

export const accountId = () => generateId("acct");

export const Account = z.object({
  id: z.string(),
  type: z.enum(["individual"]),
  name: z.string(),
});
export type Account = z.infer<typeof Account>;
