import { z } from "zod";
import {
  requestTestnetFaucet,
  CircleTestnetFaucetError,
  CircleTooManyRequestsError,
} from "@/circle";
import { err, ok, Result } from "@/lib";

import { Wallet, Deposit, depositId, saveDeposit } from "@/payments/entities";
import { StablecoinToken, isStablecoinSupported } from "@/payments/values";
import {
  PaymentLiveModeError,
  PaymentUnsupportedTokenError,
} from "@/payments/errors";

export const DepositMoneyDTO = z.object({
  type: z.enum(["testnet_faucet"]), // TODO: Add other types of deposits, like CC
  currency: StablecoinToken.default("USDC"),
});

export const depositMoney = async (
  wallet: Wallet,
  dto: z.infer<typeof DepositMoneyDTO>
): Promise<
  Result<
    Deposit,
    | PaymentLiveModeError
    | PaymentUnsupportedTokenError
    | CircleTestnetFaucetError
    | CircleTooManyRequestsError
  >
> => {
  if (wallet.live) {
    return err({
      type: "PaymentLiveModeError",
      message: "Testnet deposits are only supported on test (non-live) wallets",
    });
  }

  if (
    !isStablecoinSupported({
      blockchain: wallet.blockchain,
      token: dto.currency,
    })
  ) {
    return err({
      type: "PaymentUnsupportedTokenError",
      token: dto.currency,
      blockchain: wallet.blockchain,
    });
  }

  const deposit = Deposit.parse({
    id: depositId(),
    type: dto.type,
    currency: dto.currency,
    status: "completed",
    live: wallet.live,
    wallet: wallet.id,
    created_at: new Date(),
  });

  const depositResponse = await requestTestnetFaucet({
    address: wallet.address,
    blockchain: wallet.blockchain,
    live: wallet.live,
    currencies: [dto.currency],
  });

  if (!depositResponse.ok) return depositResponse;

  await saveDeposit(deposit);

  return ok(deposit);
};
