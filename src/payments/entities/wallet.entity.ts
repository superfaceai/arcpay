import { z } from "zod";
import { generateId, DateCodec } from "@/lib/index.js";
import { Blockchain } from "@/payments/values/index.js";

export const walletId = () => generateId("wt");

export const Wallet = z.object({
  id: z.string(),
  owner: z.string(),
  address: z.string(),
  blockchain: Blockchain,
  live: z.boolean(),
  created_at: DateCodec,
  issuer: z.enum(["circle"]),
  circle: z.object({
    id: z.string(),
    state: z.string(),
    network: z.string(),
  }),
});

export type Wallet = z.infer<typeof Wallet>;
