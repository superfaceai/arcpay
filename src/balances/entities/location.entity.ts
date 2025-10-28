import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Blockchain, Currency, PositiveAmount } from "@/balances/values";

export const locationId = () => generateId("loc");

export const LocationAsset = z.object({
  currency: Currency,
  amount: PositiveAmount,
});
export type LocationAsset = z.infer<typeof LocationAsset>;

export const Location = z.object({
  id: z.string(),
  owner: z.string(),
  live: z.boolean(),
  type: z.enum(["crypto_wallet"]),
  address: z.string(),
  blockchain: Blockchain,
  created_at: DateCodec,
  assets: z.array(LocationAsset),
});

export type Location = z.infer<typeof Location>;
