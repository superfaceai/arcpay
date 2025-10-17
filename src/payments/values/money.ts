import { z } from "zod";
import { Amount } from "./amount.js";
import { Currency } from "./currency.js";

export const Money = z.object({
  currency: Currency,
  amount: Amount,
});

export type Money = z.infer<typeof Money>;
