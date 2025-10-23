import {
  Balance,
  TestnetBlockchain,
  Wallet,
} from "@circle-fin/developer-controlled-wallets";

import Config from "@/config";
import { Result, tryAsync } from "@/lib";
import { Blockchain, StablecoinToken } from "@/payments/values";

import { client } from "./client.js";
import { chooseCircleBlockchain } from "./blockchain.js";
import {
  CircleCreateWalletError,
  CircleFetchBalanceError,
  CircleTestnetFaucetError,
  CircleTooManyRequestsError,
} from "./errors.js";

export const createWallet = async ({
  blockchain,
  live,
}: {
  blockchain: Blockchain;
  live: boolean;
}): Promise<Result<Wallet, CircleCreateWalletError>> =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      const walletsResponse = await client.createWallets({
        blockchains: [chain],
        walletSetId: Config.CIRCLE_WALLETSET_ID,
        accountType: "EOA",
        count: 1,
      });

      if (
        !walletsResponse.data?.wallets ||
        walletsResponse.data.wallets.length === 0
      ) {
        throw new Error("Could not create wallet on the network");
      }

      return walletsResponse.data.wallets[0];
    },
    (error) => ({
      type: "CircleCreateWalletError",
      message: String(error),
    })
  );

export const fetchWalletBalance = async ({
  circleWalletId,
}: {
  circleWalletId: string;
}): Promise<Result<Balance[], CircleFetchBalanceError>> =>
  tryAsync(
    async () => {
      const balance = await client.getWalletTokenBalance({
        id: circleWalletId,
        includeAll: true,
      });

      return balance.data?.tokenBalances || [];
    },
    (error) => ({
      type: "CircleFetchBalanceError",
      message: String(error),
    })
  );

export const requestTestnetFaucet = async ({
  blockchain,
  live,
  address,
  currencies,
}: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
  currencies: StablecoinToken[];
}): Promise<
  Result<void, CircleTestnetFaucetError | CircleTooManyRequestsError>
> =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      await client.requestTestnetTokens({
        address,
        blockchain: chain as TestnetBlockchain,
        native: true,
        usdc: currencies.includes("USDC"),
        eurc: currencies.includes("EURC"),
      });
    },
    (error: any) => {
      if (error.response) {
        if (error.response.status === 429) {
          return {
            type: "CircleTooManyRequestsError",
            message:
              "Too many requests for testnet funds. Please try again later.",
          };
        } else {
          const message = error?.response.data.message
            ? error.response.data.message
            : JSON.stringify(error.response.data);

          return {
            type: "CircleTestnetFaucetError",
            message,
          };
        }
      } else {
        return {
          type: "CircleTestnetFaucetError",
          message: error.message ?? "Unknown error",
        };
      }
    }
  );
