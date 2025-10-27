import { ok, Result } from "@/lib";

import { eraseCallsForUser } from "@/api/entities/call.db";
import { eraseUser, eraseApiKeysForUser } from "@/identity/entities";
import {
  eraseLocationsForUser,
  eraseTransactionsForUser,
  eraseBalancesForUser,
  erasePaymentsForUser,
} from "@/payments/entities";

export const erase = async ({
  userId,
}: {
  userId: string;
}): Promise<Result<void, void>> => {
  await erasePaymentsForUser({ userId });
  await eraseTransactionsForUser({ userId });
  await eraseCallsForUser({ userId });
  await eraseLocationsForUser({ userId });
  await eraseBalancesForUser({ userId });
  await eraseUser({ userId });
  await eraseApiKeysForUser({ userId });

  return ok();
};
