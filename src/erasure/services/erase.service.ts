import { ok, Result } from "@/lib";

import { eraseCallsForAccount } from "@/api/entities";
import { eraseAccount, eraseApiKeysForAccount } from "@/identity/entities";
import {
  eraseLocationsForAccount,
  eraseBalancesForAccount,
} from "@/balances/entities";
import {
  eraseTransactionsForAccount,
  erasePaymentsForAccount,
  erasePaymentMandatesForAccount,
  erasePaymentCapturesForAccount,
} from "@/payments/entities";

export const erase = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Result<void, void>> => {
  await erasePaymentMandatesForAccount({ accountId });
  await erasePaymentsForAccount({ accountId });
  await erasePaymentCapturesForAccount({ accountId });
  await eraseTransactionsForAccount({ accountId });
  await eraseCallsForAccount({ accountId });
  await eraseLocationsForAccount({ accountId });
  await eraseBalancesForAccount({ accountId });
  await eraseAccount({ accountId });
  await eraseApiKeysForAccount({ accountId });

  return ok();
};
