import { CircleFetchBalanceError, fetchWalletBalance } from "@/circle/index.js";
import Big from "big.js";
import { ok, Result } from "@/lib/index.js";

import { Balance, isValidToken, mainToken, Token } from "@/payments/values/index.js";
import { Wallet } from "@/payments/entities/index.js";

export const getWalletBalance = async (
  wallet: Wallet
): Promise<Result<Balance, CircleFetchBalanceError>> => {
  const onchainWalletBalance = await fetchWalletBalance({
    circleWalletId: wallet.circle.id,
  });

  if (!onchainWalletBalance.ok) return onchainWalletBalance;

  // console.log(onchainWalletBalance.value);

  const presentCurrencies = onchainWalletBalance.value
    .filter((balance) => isValidToken(balance.token.symbol))
    .map((balance) => mainToken(balance.token.symbol as Token))
    .filter((token) => token !== undefined)
    .filter((token, index, self) => self.indexOf(token) === index);

  const balance = Balance.parse({
    wallet: wallet.id,
    live: wallet.live,
    available: presentCurrencies.map((currency) => {
      let total = Big(0);

      onchainWalletBalance.value.forEach((balance) => {
        if (currency === mainToken(balance.token.symbol as Token)) {
          total = total.plus(balance.amount);
        }
      });

      return {
        currency,
        amount: total.toString(),
      };
    }),
  });

  return ok(balance);
};
