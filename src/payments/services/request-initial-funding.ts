import { err, ok, Result } from "@/lib";

import {
  InitialFunding,
  initialFundingId,
  saveInitialFunding,
} from "@/payments/entities";
import { InitialFundingNotAllowed } from "@/payments/errors";

import { InitialFundingFeature } from "@/features/initial-funding";

export const requestInitialFunding = async ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}): Promise<Result<InitialFunding, InitialFundingNotAllowed>> => {
  if (!InitialFundingFeature.isEnabled()) {
    return err({
      type: "InitialFundingNotAllowed",
      reason: "disabled",
    });
  }

  if (!(await InitialFundingFeature.canUseInitialFunding({ live }))) {
    return err({
      type: "InitialFundingNotAllowed",
      reason: "quota_exceeded",
    });
  }

  const settings = InitialFundingFeature.getInitialFundingSettings();

  const initialFunding: InitialFunding = InitialFunding.parse({
    id: initialFundingId(),
    live,
    account: accountId,
    amount: settings.amountUsdc,
    currency: settings.currency,
    status: "requested",
    created_at: new Date(),
  });

  await saveInitialFunding(initialFunding);
  await InitialFundingFeature.recordUseOfInitialFunding({ live });

  return ok(initialFunding);
};
