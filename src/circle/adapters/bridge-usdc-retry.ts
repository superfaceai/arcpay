import { tryAsync } from "@/lib";

import { withBigIntDeserialization } from "@/lib/bigint";

import { RetryUSDCBridgeBetweenBlockchains } from "@/payments/interfaces";

import { BridgeKit } from "@circle-fin/bridge-kit";

import { circleWalletsAdapter } from "../circle-wallets-adapter";
import {
  mapBridgeResult,
  mapBridgeResultTransactions,
} from "../services/map-bridge-result";

export const retryUSDCBridgeBetweenBlockchains: RetryUSDCBridgeBetweenBlockchains =
  async ({ bridgeTransfer }) =>
    tryAsync(
      async () => {
        const kit = new BridgeKit();

        const previousBridgeKitResult = withBigIntDeserialization(
          bridgeTransfer.raw
        );

        const result = await kit.retry(previousBridgeKitResult, {
          from: circleWalletsAdapter,
          to: circleWalletsAdapter,
        });

        const updatedBridgeTransfer = mapBridgeResult({
          previousBridgeTransfer: bridgeTransfer,
          amount: bridgeTransfer.amount,
          from: { locationId: bridgeTransfer.from_location },
          to: { locationId: bridgeTransfer.to_location },
          accountId: bridgeTransfer.account,
          live: bridgeTransfer.live,
          raw: result,
        });

        const transactions = mapBridgeResultTransactions({
          bridge: bridgeTransfer,
          raw: result,
          previousRaw: withBigIntDeserialization(bridgeTransfer.raw),
        });

        return {
          bridge: updatedBridgeTransfer,
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
