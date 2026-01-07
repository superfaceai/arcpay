import { tryAsync } from "@/lib";

import {
  withBigIntDeserialization,
  withBigIntSerialization,
} from "@/lib/bigint";

import { BridgeTransfer } from "@/payments/entities";
import { RetryUSDCBridgeBetweenBlockchains } from "@/payments/interfaces";

import { BridgeKit } from "@circle-fin/bridge-kit";

import { circleWalletsAdapter } from "../circle-wallets-adapter";
import { mapBridgeStatus } from "../services/map-bridge-result";

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

        return BridgeTransfer.parse({
          ...bridgeTransfer,
          status: mapBridgeStatus(result.state),
          raw: withBigIntSerialization(result),
        });
      },
      (error) => ({
        type: "BlockchainBridgeError",
        message: String(error),
      })
    );
