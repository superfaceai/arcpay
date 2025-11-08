import { err, ok, Result } from "@/lib";

import {
  Contact,
  loadAccountById,
  Account,
  saveAccount,
} from "@/identity/entities";
import { AccountContactNotAllowedError } from "@/identity/errors";

export const deleteAccountContact = async (
  accountId: string,
  contactId: string
): Promise<Result<Contact | null, AccountContactNotAllowedError>> => {
  const account = (await loadAccountById(accountId))!;

  const existingContact = account.contacts.find(
    (contact) => contact.id === contactId
  );

  if (!existingContact) {
    return ok(null);
  }

  if (existingContact.verified)
    return err({
      type: "AccountContactNotAllowedError",
      message: "Cannot delete verified contact",
    });

  const updatedAccount: Account = {
    ...account,
    contacts: account.contacts.filter((cnt) => cnt.id !== contactId),
  };

  await saveAccount(updatedAccount);
  return ok(existingContact);
};
