import { err, ok, Result } from "@/lib";

import {
  BlockchainBridgeError,
  BridgeTransferLocationError,
  BridgeTransferCurrencyError,
  PaymentInsufficientBalanceError,
  BridgeTransferRetryError,
} from "@/payments/errors";
import { BridgeTransfer, saveBridgeTransfer } from "@/payments/entities";
import { BlockchainWalletActionError } from "@/balances/errors";

import { RetryUSDCBridgeBetweenBlockchains } from "@/payments/interfaces";
import { retryUSDCBridgeBetweenBlockchains } from "@/circle/adapters";

export const retryBridgeTransfer = async ({
  accountId,
  live,
  bridgeTransfer,
  retryUSDCBridgeBetweenBlockchainsAdapter = retryUSDCBridgeBetweenBlockchains,
}: {
  accountId: string;
  live: boolean;
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

  await saveBridgeTransfer({
    accountId,
    bridgeTransfer: retryUSDCBridgeBetweenBlockchainsResult.value,
  });

  return ok(retryUSDCBridgeBetweenBlockchainsResult.value);
};
