import { err, ok, Result } from "@/lib";

import {
  BlockchainBridgeError,
  BridgeTransferRetryError,
} from "@/payments/errors";
import { BridgeTransfer, Transaction } from "@/payments/entities";

import { RetryUSDCBridgeBetweenBlockchains } from "@/payments/interfaces";
import { retryUSDCBridgeBetweenBlockchains } from "@/circle/adapters";
import { saveBridgeTransferWithTransactions } from "../repositories";

export const retryBridgeTransfer = async ({
  accountId,
  bridgeTransfer,
  retryUSDCBridgeBetweenBlockchainsAdapter = retryUSDCBridgeBetweenBlockchains,
}: {
  accountId: string;
  bridgeTransfer: BridgeTransfer;
  retryUSDCBridgeBetweenBlockchainsAdapter?: RetryUSDCBridgeBetweenBlockchains;
}): Promise<
  Result<BridgeTransfer, BlockchainBridgeError | BridgeTransferRetryError>
> => {
  if (bridgeTransfer.status === "succeeded") {
    return err({
      type: "BridgeTransferRetryError",
      reason: "already_succeeded",
    });
  }

  if (bridgeTransfer.status === "retrying") {
    return err({
      type: "BridgeTransferRetryError",
      reason: "already_retrying",
    });
  }

  // Retry the bridge operation
  const retryUSDCBridgeBetweenBlockchainsResult =
    await retryUSDCBridgeBetweenBlockchainsAdapter({
      bridgeTransfer,
    });

  if (!retryUSDCBridgeBetweenBlockchainsResult.ok)
    return retryUSDCBridgeBetweenBlockchainsResult;

  const txs = [
    retryUSDCBridgeBetweenBlockchainsResult.value.approval?.fee,
    retryUSDCBridgeBetweenBlockchainsResult.value.burn?.fee,
    retryUSDCBridgeBetweenBlockchainsResult.value.burn?.tx,
    retryUSDCBridgeBetweenBlockchainsResult.value.mint?.fee,
    retryUSDCBridgeBetweenBlockchainsResult.value.mint?.tx,
  ].filter(Boolean) as Transaction[];

  await saveBridgeTransferWithTransactions(
    accountId,
    retryUSDCBridgeBetweenBlockchainsResult.value.bridge,
    txs
  );

  return ok(retryUSDCBridgeBetweenBlockchainsResult.value.bridge);
};
