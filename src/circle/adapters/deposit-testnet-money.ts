import { TestnetBlockchain } from "@circle-fin/developer-controlled-wallets";

import { tryAsync } from "@/lib";
import { DepositTestnetMoney } from "@/payments/interfaces";

import { client } from "../client";
import { chooseCircleBlockchain } from "../blockchain";

export const depositTestnetMoney: DepositTestnetMoney = async ({
  blockchain,
  address,
  currencies,
  live,
}) =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      await client.requestTestnetTokens({
        address,
        blockchain: chain as TestnetBlockchain,
        native: true, // always deposit the native token (for gas)
        usdc: currencies.includes("USDC"),
        eurc: currencies.includes("EURC"),
      });
      return;
    },
    (error: any) => {
      if (error.response) {
        if (error.response.status === 429) {
          return {
            type: "BlockchainActionRateExceeded",
            message:
              "Too many requests for testnet funds. Please try again later.",
            blockchain,
          };
        } else {
          const message = error?.response.data.message
            ? error.response.data.message
            : JSON.stringify(error.response.data);

          return {
            type: "BlockchainPaymentActionError",
            blockchain,
            message,
          };
        }
      } else {
        return {
          type: "BlockchainPaymentActionError",
          message: error.message ?? "Unknown error",
          blockchain,
        };
      }
    }
  );
