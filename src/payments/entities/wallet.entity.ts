import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { Amount, Blockchain, Currency } from "@/payments/values";

export const walletId = () => generateId("hld");

export const WalletAsset = z.object({
  currency: Currency,
  amount: Amount,
});
export type WalletAsset = z.infer<typeof WalletAsset>;

export const Wallet = z.object({
  id: z.string(),
  owner: z.string(),
  live: z.boolean(),
  address: z.string(),
  blockchain: Blockchain,
  created_at: DateCodec,
  assets: z.array(WalletAsset),
});

export type Wallet = z.infer<typeof Wallet>;
