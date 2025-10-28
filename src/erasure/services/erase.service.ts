import { ok, Result } from "@/lib";

import { eraseCallsForAccount } from "@/api/entities";
import { eraseAccount, eraseApiKeysForAccount } from "@/identity/entities";
import {
  eraseLocationsForAccount,
  eraseTransactionsForAccount,
  eraseBalancesForAccount,
  erasePaymentsForAccount,
} from "@/payments/entities";

export const erase = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Result<void, void>> => {
  await erasePaymentsForAccount({ accountId });
  await eraseTransactionsForAccount({ accountId });
  await eraseCallsForAccount({ accountId });
  await eraseLocationsForAccount({ accountId });
  await eraseBalancesForAccount({ accountId });
  await eraseAccount({ accountId });
  await eraseApiKeysForAccount({ accountId });

  return ok();
};
