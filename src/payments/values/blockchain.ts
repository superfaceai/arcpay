import { z } from "zod";

export const BLOCKCHAINS = [
  "arc",
  "polygon",
  "ethereum",
  "avalanche",
  "solana",
  "arbitrum",
  "unichain",
  "base",
  "optimism",
] as const;

export const Blockchain = z.enum(BLOCKCHAINS);
export type Blockchain = z.infer<typeof Blockchain>;
