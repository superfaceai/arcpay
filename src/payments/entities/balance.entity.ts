import { z } from "zod";
import { generateId } from "@/lib";

import { Amount, Currency } from "@/payments/values";
import { Wallet } from "./wallet.entity";

export const balanceId = (currency: Currency) =>
  generateId(`bal_${currency.toLowerCase()}`);

export const Balance = z.object({
  id: z.string(),
  owner: z.string(),
  live: z.boolean(),
  currency: Currency,
  amount: Amount,
  holdings: z.array(Wallet.shape.id),
});

export type Balance = z.infer<typeof Balance>;
