import Big from "big.js";

import { tryAsync } from "@/lib";
import { GetBlockchainWalletBalance } from "@/payments/interfaces";
import { isValidToken, tokenToCurrency } from "@/payments/values";

import { getCircleWalletIds } from "../services/get-circle-wallet-ids";
import { client } from "../client";

export const getBlockchainWalletBalance: GetBlockchainWalletBalance = async ({
  address,
  blockchain,
  live,
}) =>
  tryAsync(
    async () => {
      const { circleWalletIds } = await getCircleWalletIds({
        wallets: [{ address, blockchain, locationId: "" }],
        live,
      });

      if (circleWalletIds.length === 0) return [];

      const balance = await client.getWalletTokenBalance({
        id: circleWalletIds[0],
        includeAll: true,
      });

      const circleTokenBalances = balance.data?.tokenBalances || [];

      if (circleTokenBalances.length === 0) return [];

      const walletCurrencies = circleTokenBalances
        .map((balance) => balance.token.symbol)
        .filter((tokenSymbol) => isValidToken(tokenSymbol))
        .map((tokenSymbol) => tokenToCurrency(tokenSymbol))
        .filter((currency, index, self) => self.indexOf(currency) === index);

      return walletCurrencies.map((currency) => {
        let total = Big(0);

        circleTokenBalances.forEach((balance) => {
          const tokenSymbol = isValidToken(balance.token.symbol)
            ? balance.token.symbol
            : undefined;

          if (!tokenSymbol) return;

          if (currency === tokenToCurrency(tokenSymbol)) {
            total = total.plus(balance.amount);
          }
        });

        return {
          currency,
          amount: total.toString(),
        };
      });
    },
    (error) => ({
      type: "BlockchainActionError",
      message: String(error),
      blockchain,
    })
  );
