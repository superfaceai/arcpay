import Big from "big.js";
import { z } from "zod";
import { generateId } from "@/lib";

import { Currency, PositiveAmount } from "@/balances/values";
import { Location } from "./location.entity";

export const balanceId = (currency: Currency) =>
  generateId(`bal_${currency.toLowerCase()}`);

export const Balance = z.object({
  id: z.string(),
  owner: z.string(),
  currency: Currency,
  amount: PositiveAmount,
  live: z.boolean(),
  locations: z.array(Location.shape.id),
});

export type Balance = z.infer<typeof Balance>;

export const sortBalancesDesc = (a: Balance, b: Balance) =>
  Big(b.amount).minus(Big(a.amount)).toNumber();
