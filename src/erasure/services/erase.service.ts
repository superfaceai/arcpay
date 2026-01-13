import Big from "big.js";
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
  eraseInitialFundingsForAccount,
  eraseBridgeTransfersForAccount,
} from "@/payments/entities";
import {
  eraseNotificationRulesForAccount,
  eraseNotificationsForAccount,
} from "@/notifications/entities";
import { ReturnFundsOnErasureFeature } from "@/features/return-funds-on-erasure";
import { hasBalanceInSingleLocation } from "@/balances/services";
import { pay } from "@/payments/services";

export const erase = async ({
  accountId,
}: {
  accountId: string;
}): Promise<Result<void, void>> => {
  if (ReturnFundsOnErasureFeature.isEnabled()) {
    const returnFundsSettings =
      ReturnFundsOnErasureFeature.getReturnFundsOnErasureSettings();

    const hasBalance = await hasBalanceInSingleLocation({
      accountId,
      live: false,
      amount: "0.15", // Check if there's at least 0.2 USDC on the account
      currency: returnFundsSettings.currency,
      preferredBlockchain: returnFundsSettings.blockchain,
    });

    if (
      hasBalance.ok &&
      hasBalance.value.hasBalance &&
      hasBalance.value.inSingleLocation &&
      hasBalance.value.inPreferredBlockchain
    ) {
      const amountAvailable = hasBalance.value.availableAmount;

      const amountToReturn = Big(amountAvailable).sub(Big(0.1)).toString();

      const returnPayment = await pay({
        live: false,
        trigger: {
          senderAccountId: accountId,
          trigger: "user",
          authorization: { method: "user" },
        },
        dto: {
          amount: amountToReturn,
          currency: returnFundsSettings.currency,
          method: "crypto",
          crypto: {
            blockchain: returnFundsSettings.blockchain!,
            address: returnFundsSettings.address!,
          },
        },
      });

      if (!returnPayment.ok) {
        console.error(
          `Failed to return funds (${
            returnFundsSettings.currency
          } ${amountToReturn}): ${JSON.stringify(returnPayment.error)}`
        );
      } else {
        console.info(
          `Returned funds (${returnFundsSettings.currency} ${amountToReturn}) on ${returnFundsSettings.blockchain} to ${returnFundsSettings.address}`
        );
      }
    }
  }

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
  await eraseBridgeTransfersForAccount({ accountId });
  await eraseCallsForAccount({ accountId });
  await eraseInitialFundingsForAccount({ accountId });
  await eraseLocationsForAccount({ accountId });
  await eraseBalancesForAccount({ accountId });
  await eraseAccount({ accountId });
  await eraseApiKeysForAccount({ accountId });

  return ok();
};
