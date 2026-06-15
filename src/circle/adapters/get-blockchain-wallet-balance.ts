import Big from "big.js";

import { tryAsync } from "@/lib";
import {
  getNativeTokenFor,
  isStablecoinSupported,
  isValidToken,
  STABLECOIN_TOKENS,
  StablecoinToken,
  tokenToCurrency,
} from "@/balances/values";
import { GetBlockchainWalletBalance } from "@/balances/interfaces";

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

      const nativeCurrency = tokenToCurrency(getNativeTokenFor({ blockchain }));
      const nativeStablecoinCollision =
        STABLECOIN_TOKENS.includes(nativeCurrency as StablecoinToken) &&
        isStablecoinSupported({
          blockchain,
          token: nativeCurrency as StablecoinToken,
        });

      return walletCurrencies.map((currency) => {
        const matchingAmounts = circleTokenBalances
          .map((balance) => {
            const tokenSymbol = isValidToken(balance.token.symbol)
              ? balance.token.symbol
              : undefined;

            if (!tokenSymbol) return null;
            if (currency !== tokenToCurrency(tokenSymbol)) return null;

            return Big(balance.amount);
          })
          .filter((amount) => amount !== null);

        const amount =
          nativeStablecoinCollision && currency === nativeCurrency
            ? matchingAmounts.reduce(
                (max, amount) => (amount.gt(max) ? amount : max),
                Big(0)
              )
            : matchingAmounts.reduce((total, amount) => total.plus(amount), Big(0));

        return {
          currency,
          amount: amount.toString(),
        };
      });
    },
    (error) => ({
      type: "BlockchainWalletActionError",
      message: String(error),
      blockchain,
    })
  );
