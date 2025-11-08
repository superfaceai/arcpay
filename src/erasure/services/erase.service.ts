import { ok, Result } from "@/lib";

import { eraseCallsForAccount } from "@/api/entities";
import {
  eraseAccount,
  eraseApiKeysForAccount,
  eraseContactVerifications,
  loadAccountById,
} from "@/identity/entities";
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
import {
  eraseNotificationRulesForAccount,
  eraseNotificationsForAccount,
} from "@/notifications/entities";

export const erase = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Result<void, void>> => {
  const account = await loadAccountById(accountId);
  if (account) {
    const phoneNumbers = account.contacts
      .filter((contact) => contact.method === "phone")
      .map((contact) => contact.phone_number);
    const emails = account.contacts
      .filter((contact) => contact.method === "email")
      .map((contact) => contact.email);

    await eraseContactVerifications({ phoneNumbers, emails });
  }

  await eraseNotificationsForAccount({ accountId });
  await eraseNotificationRulesForAccount({ accountId });
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
