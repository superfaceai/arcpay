import { z } from "zod";
import { STABLECOIN_TOKENS, NATIVE_TOKENS } from "./token.js";

export const Currency = z.enum([...STABLECOIN_TOKENS, ...NATIVE_TOKENS]);
export type Currency = z.infer<typeof Currency>;
