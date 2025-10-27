import { z } from "zod";
import {
  STABLECOIN_TOKENS,
  NATIVE_TOKENS,
  NATIVE_TESTNET_TOKENS,
  Token,
  mainToken,
  NativeTestnetToken,
  NativeMainnetToken,
  StablecoinToken,
} from "./token.js";

export const Currency = z.enum([...STABLECOIN_TOKENS, ...NATIVE_TOKENS]);
export type Currency = z.infer<typeof Currency>;

/**
 * Converts any token to a valid Currency symbol.
 */
export const tokenToCurrency = (token: Token): Currency => {
  if (STABLECOIN_TOKENS.includes(token as StablecoinToken))
    return Currency.parse(token);
  if (NATIVE_TOKENS.includes(token as NativeMainnetToken))
    return Currency.parse(token);

  if (NATIVE_TESTNET_TOKENS.includes(token as NativeTestnetToken)) {
    return Currency.parse(mainToken(token));
  }

  throw new Error(`Invalid currency token candidate: ${token}`);
};
