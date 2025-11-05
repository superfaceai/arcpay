import { ok, Result } from "@/lib";

import {
  Contact,
  loadAccountById,
  Account,
  saveAccount,
} from "@/identity/entities";

export const deleteAccountContact = async (
  accountId: string,
  contactId: string
): Promise<Result<Contact | null, void>> => {
  const account = (await loadAccountById(accountId))!;

  const existingContact = account.contacts.find(
    (contact) => contact.id === contactId
  );

  if (!existingContact) {
    return ok(null);
  }

  const updatedAccount: Account = {
    ...account,
    contacts: account.contacts.filter((cnt) => cnt.id !== contactId),
  };

  await saveAccount(updatedAccount);
  return ok(existingContact);
};
