import { tryAsync } from "@/lib";

import { withBigIntSerialization } from "@/lib/bigint";

import { mapAmount } from "@/balances/values";
import { BridgeTransfer, bridgeTransferId } from "@/payments/entities";
import { BridgeUSDCBetweenBlockchains } from "@/payments/interfaces";

import { BridgeKit, BridgeResult } from "@circle-fin/bridge-kit";

import { circleWalletsAdapter } from "../circle-wallets-adapter";
import { chooseCircleBridgeBlockchain } from "../bridge-blockchain";

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

        return BridgeTransfer.parse({
          id: bridgeTransferId(),
          live,
          account: accountId,
          amount: amount.toString(),
          currency: "USDC",
          from_location: from.locationId,
          to_location: to.locationId,
          status: mapStatus(result.state),
          created_at: new Date(),
          raw: withBigIntSerialization(result),
        });
      },
      (error) => ({
        type: "BlockchainBridgeError",
        message: String(error),
      })
    );


const mapStatus = (status: BridgeResult['state']): BridgeTransfer['status'] => {
  if (status === "pending") return "retrying";
  if (status === "success") return "succeeded";
  if (status === "error") return "failed";
  throw new Error(`Unknown status: ${status}`);
};
