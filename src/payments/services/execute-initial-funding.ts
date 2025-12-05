import { err, ok, Result } from "@/lib";

import {
  BlockchainWalletActionError,
  UnsupportedBlockchainError,
} from "@/balances/errors";
import { ensureLocation } from "@/balances/services";

import { InitialFunding, saveInitialFunding } from "@/payments/entities";
import { BlockchainPaymentActionError } from "@/payments/errors";

import { InitialFundingFeature } from "@/features/initial-funding";
import { sendTransactionOnArcTestnet } from "@/arc/services";

export const executeInitialFunding = async ({
  initialFunding,
  onUpdate,
}: {
  initialFunding: InitialFunding;
  onUpdate: (initialFunding: InitialFunding) => Promise<void>;
}): Promise<
  Result<
    InitialFunding,
    | UnsupportedBlockchainError
    | BlockchainWalletActionError
    | BlockchainPaymentActionError
  >
> => {
  if (
    initialFunding.status === "failed" ||
    initialFunding.status === "succeeded"
  ) {
    return ok(initialFunding);
  }

  const fundingSettings = InitialFundingFeature.getInitialFundingSettings();

  // 1) Ensure a location exists for the funding currency on the preferred blockchain
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const locationResult = await ensureLocation({
    accountId: initialFunding.account,
    live: initialFunding.live,
    currency: fundingSettings.currency,
    preferredBlockchains: [fundingSettings.blockchain],
  });

  if (!locationResult.ok) {
    const failedFunding: InitialFunding = {
      ...initialFunding,
      status: "failed",
      failure_reason: `Unable to ensure location on '${
        fundingSettings.blockchain
      }': ${JSON.stringify(locationResult.error)}`,
      finished_at: new Date(),
    };
    await saveInitialFunding(failedFunding);
    await onUpdate(failedFunding);
    return locationResult;
  }

  const processingFunding: InitialFunding = {
    ...initialFunding,
    status: "processing",
    location: locationResult.value.id,
  };
  await saveInitialFunding(processingFunding);
  await onUpdate(processingFunding);

  // 2) Send money from our Arc testnet wallet to the user's location
  try {
    if (fundingSettings.blockchain !== "arc") {
      throw new Error(
        `Initial funding is only available on 'arc' (not '${fundingSettings.blockchain}')`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const receiverWalletAddress = locationResult.value.address;

    const sendTransactionResult = await sendTransactionOnArcTestnet({
      fromWalletPrivateKey: fundingSettings.privateKey,
      toAddress: receiverWalletAddress,
      amount: initialFunding.amount,
    });

    if (!sendTransactionResult.ok)
      throw new Error(
        `Failed to send transaction: ${sendTransactionResult.error.message}`
      );

    const succeededFunding: InitialFunding = {
      ...initialFunding,
      status: "succeeded",
      tx_hash: sendTransactionResult.value.txHash,
      finished_at: new Date(),
    };
    await saveInitialFunding(succeededFunding);
    await onUpdate(succeededFunding);
    return ok(succeededFunding);
  } catch (error) {
    const failedFunding: InitialFunding = {
      ...initialFunding,
      status: "failed",
      failure_reason: `Failed to fund account: ${String(error)}`,
      finished_at: new Date(),
    };
    await saveInitialFunding(failedFunding);
    await onUpdate(failedFunding);
    return err({
      type: "BlockchainPaymentActionError",
      message: `Failed to fund account: ${String(error)}`,
      blockchain: fundingSettings.blockchain,
    });
  }
};
