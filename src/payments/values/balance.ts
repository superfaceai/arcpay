import { z } from "zod";
import { Money } from "./money.js";

export const Balance = z.object({
  wallet: z.string(),
  live: z.boolean(),
  available: z.array(Money),
});

export type Balance = z.infer<typeof Balance>;
