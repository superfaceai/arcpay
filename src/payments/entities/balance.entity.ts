import { z } from "zod";
import { generateId } from "@/lib";

import { Amount, Currency } from "../values";

export const balanceId = () => generateId("b");

export const Balance = z.object({
  id: z.string(),
  owner: z.string(),
  live: z.boolean(),
  currency: Currency,
  amount: Amount,
});

export type Balance = z.infer<typeof Balance>;
