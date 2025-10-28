import { z } from "zod";
import { err, ok, Result } from "@/lib";

import { StablecoinToken } from "@/balances/values";
import { ensureLocation } from "@/balances/services";

import { Deposit, depositId } from "@/payments/entities";
import {
  PaymentLiveModeError,
  UnsupportedBlockchainError,
  BlockchainActionRateExceeded,
  BlockchainPaymentActionError,
} from "@/payments/errors";
import { BlockchainWalletActionError } from "@/balances/errors";

import { DepositTestnetMoney } from "@/payments/interfaces";
import { depositTestnetMoney } from "@/circle/adapters";

export const DepositMoneyDTO = z.object({
  type: z.enum(["testnet_faucet"]), // TODO: Add other types of deposits, like CC
  currency: StablecoinToken.default("USDC"),
});

export const depositMoney = async (
  {
    accountId,
    live,
    depositTestnetMoneyAdapter = depositTestnetMoney,
  }: {
    accountId: string;
    live: boolean;
    depositTestnetMoneyAdapter?: DepositTestnetMoney;
  },
  dto: z.infer<typeof DepositMoneyDTO>
): Promise<
  Result<
    Deposit,
    | PaymentLiveModeError
    | UnsupportedBlockchainError
    | BlockchainPaymentActionError
    | BlockchainActionRateExceeded
    | BlockchainWalletActionError
  >
> => {
  if (live) {
    return err({
      type: "PaymentLiveModeError",
      message: "Testnet deposits are only supported on test (non-live) wallets",
    });
  }

  const locationResult = await ensureLocation({
    accountId,
    live,
    currency: dto.currency,
    preferredBlockchains: ["arc", "base", "polygon"], // TODO: Make this configurable
  });

  if (!locationResult.ok) return locationResult;

  const depositTestnetMoneyResult = await depositTestnetMoneyAdapter({
    address: locationResult.value.address,
    blockchain: locationResult.value.blockchain,
    live: false,
    currencies: [dto.currency],
  });

  if (!depositTestnetMoneyResult.ok) return depositTestnetMoneyResult;

  const deposit = Deposit.parse({
    id: depositId(),
    type: dto.type,
    currency: dto.currency,
    status: "completed",
    live: false,
    wallet: locationResult.value.id,
    created_at: new Date(),
  });

  return ok(deposit);
};
