import { tryAsync } from "@/lib";

import { mapAmount } from "@/balances/values";
import { BridgeUSDCBetweenBlockchains } from "@/payments/interfaces";

import { BridgeKit } from "@circle-fin/bridge-kit";

import { circleWalletsAdapter } from "../circle-wallets-adapter";
import { chooseCircleBridgeBlockchain } from "../bridge-blockchain";
import {
  mapBridgeResult,
  mapBridgeResultTransactions,
} from "../services/map-bridge-result";

export const bridgeUSDCBetweenBlockchains: BridgeUSDCBetweenBlockchains =
  async ({ amount, from, to, accountId, live }) =>
    tryAsync(
      async () => {
        const kit = new BridgeKit();

        const result = await kit.bridge({
          from: {
            adapter: circleWalletsAdapter,
            chain: chooseCircleBridgeBlockchain({
              blockchain: from.blockchain,
              live,
            }),
            address: from.address,
          },
          to: {
            adapter: circleWalletsAdapter,
            chain: chooseCircleBridgeBlockchain({
              blockchain: to.blockchain,
              live,
            }),
            address: to.address,
          },
          amount: mapAmount(amount, { negative: false }).toString(),
        });

        const bridgeTransfer = mapBridgeResult({
          amount,
          from,
          to,
          accountId,
          live,
          raw: result,
        });

        const transactions = mapBridgeResultTransactions({
          bridge: bridgeTransfer,
          raw: result,
        });

        return {
          bridge: bridgeTransfer,
          approval: transactions.approval,
          burn: transactions.burn,
          mint: transactions.mint,
        };
      },
      (error) => ({
        type: "BlockchainBridgeError",
        message: String(error),
      })
    );
