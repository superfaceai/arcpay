import { z } from "zod";
import { TOKENS } from "./token.js";

export const Currency = z.enum(TOKENS);
export type Currency = z.infer<typeof Currency>;
