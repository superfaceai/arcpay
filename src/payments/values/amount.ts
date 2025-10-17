import { z } from "zod";
import Big from "big.js";

const AMOUNT_RE = /^\d+\.?\d+$/;

export const Amount = z.codec(
  z.union([z.string().regex(AMOUNT_RE), z.number()]),
  z.string(),
  {
    decode: (amount) =>
      typeof amount === "number" ? Big(amount).toString() : amount,
    encode: (amount) => amount,
  }
);
export type Amount = z.infer<typeof Amount>;
