import { z } from "zod";
import { generateId, DateCodec } from "@/lib";

import { Amount, Currency } from "@/balances/values";
import { Location } from "@/balances/entities";

export const bridgeTransferId = () => generateId("btx");

export const BridgeTransferStatus = z.enum([
  "retrying",
  "succeeded",
  "failed",
]);
export type BridgeTransferStatus = z.infer<typeof BridgeTransferStatus>;

export const BridgeTransfer = z.object({
  id: z.string(),
  live: z.boolean(),
  account: z.string(),
  amount: Amount,
  currency: Currency,
  from_location: Location.shape.id,
  to_location: Location.shape.id,
  status: BridgeTransferStatus,
  created_at: DateCodec,
  finished_at: DateCodec.optional(),
  raw: z.any(), // BridgeResult from Circle's BridgeKit
});

export type BridgeTransfer = z.infer<typeof BridgeTransfer>;

export const bridgeTransferSortDesc = (a: BridgeTransfer, b: BridgeTransfer) =>
  b.created_at.getTime() - a.created_at.getTime();
