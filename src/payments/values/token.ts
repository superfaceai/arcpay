import { z } from "zod";

export const STABLECOIN_TOKENS = ["USDC", "EURC"] as const;
export const NATIVE_TOKENS = ["POL", "ETH", "AVAX", "SOL"] as const;
export const NATIVE_TESTNET_TOKENS = [
  "POL-AMOY",
  "ETH-SEPOLIA",
  "AVAX-FUJI",
  "SOL-DEVNET",
] as const;

export const TOKENS = [
  ...STABLECOIN_TOKENS,
  ...NATIVE_TOKENS,
  ...NATIVE_TESTNET_TOKENS,
] as const;

export const StablecoinToken = z.enum(STABLECOIN_TOKENS);
export type StablecoinToken = z.infer<typeof StablecoinToken>;

export const NativeMainnetToken = z.enum(NATIVE_TOKENS);
export type NativeMainnetToken = z.infer<typeof NativeMainnetToken>;

export const NativeTestnetToken = z.enum(NATIVE_TESTNET_TOKENS);
export type NativeTestnetToken = z.infer<typeof NativeTestnetToken>;

export const Token = z.enum(TOKENS);
export type Token = z.infer<typeof Token>;

export const isValidToken = (token: string | undefined): token is Token => {
  return token !== undefined && TOKENS.includes(token as Token);
}

const TEST_TO_MAINNET_MAP: { [key in NativeTestnetToken]: NativeMainnetToken } =
  {
    "POL-AMOY": "POL",
    "ETH-SEPOLIA": "ETH",
    "AVAX-FUJI": "AVAX",
    "SOL-DEVNET": "SOL",
  } as const;

/**
 * Converts any token to a mainnet token as we differentiate
 * between main and testnets via `live` flag.
 */
export const mainToken = (token: Token): Token => {
  return token in TEST_TO_MAINNET_MAP
    ? TEST_TO_MAINNET_MAP[token as NativeTestnetToken]
    : token;
};
