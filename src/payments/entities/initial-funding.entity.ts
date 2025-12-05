import { z } from "zod";
import { generateId, DateCodec } from "@/lib";

import { Amount, Currency } from "@/balances/values";
import { Location } from "@/balances/entities";

export const initialFundingId = () => generateId("ifund");

export const InitialFundingStatus = z.enum([
  "requested",
  "processing",
  "succeeded",
  "failed",
]);
export type InitialFundingStatus = z.infer<typeof InitialFundingStatus>;

export const InitialFunding = z.object({
  id: z.string(),
  live: z.boolean(),
  account: z.string(),
  amount: Amount,
  currency: Currency,
  location: Location.shape.id.optional(),
  status: InitialFundingStatus,
  failure_reason: z.string().optional(),
  tx_hash: z.string().optional(),
  created_at: DateCodec,
  finished_at: DateCodec.optional(),
});

export type InitialFunding = z.infer<typeof InitialFunding>;
