import { z } from "zod";
import Big from "big.js";

const POSITIVE_AMOUNT_RE = /^\d*\.?\d+$/;
const NEGATIVE_AMOUNT_RE = /^-?\d*\.?\d+$/;

export const PositiveAmount = z.codec(
  z.union([z.string().regex(POSITIVE_AMOUNT_RE), z.number()]),
  z.string(),
  {
    decode: (amount) =>
      typeof amount === "number" ? Big(amount).toString() : amount,
    encode: (amount) => amount,
  }
);
export type PositiveAmount = z.infer<typeof PositiveAmount>;

export const NegativeAmount = z.codec(
  z.union([z.string().regex(NEGATIVE_AMOUNT_RE), z.number()]),
  z.string(),
  {
    decode: (amount) =>
      typeof amount === "number" ? Big(amount).toString() : amount,
    encode: (amount) => amount,
  }
);
export type NegativeAmount = z.infer<typeof NegativeAmount>;

export const Amount = z.union([PositiveAmount, NegativeAmount]);
export type Amount = z.infer<typeof Amount>;

export const mapAmount = (
  amount: string | undefined,
  { negative }: { negative: boolean }
): Amount => {
  if (!amount) {
    return "0";
  }
  return Big(amount)
    .abs()
    .mul(negative ? -1 : 1)
    .toString();
};
