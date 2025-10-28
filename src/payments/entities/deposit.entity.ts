import { z } from "zod";
import { generateId, DateCodec } from "@/lib";
import { StablecoinToken } from "@/balances/values";

export const depositId = () => generateId("dp");

export const DepositType = z.enum(["testnet_faucet"]); // TODO: Add other types of deposits, like CC
export type DepositType = z.infer<typeof DepositType>;

export const DepositStatus = z.enum([
  "awaiting_deposit",
  "processing",
  "completed",
  "canceled",
  "failed",
]);
export type DepositStatus = z.infer<typeof DepositStatus>;

export const Deposit = z.object({
  id: z.string(),
  type: DepositType,
  currency: StablecoinToken,
  live: z.boolean(),
  status: DepositStatus,
  wallet: z.string(),
  created_at: DateCodec,
});

export type Deposit = z.infer<typeof Deposit>;
