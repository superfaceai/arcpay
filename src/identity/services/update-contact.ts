import { z } from "zod";
import { err, ok, Result } from "@/lib";

import {
  Contact,
  loadAccountById,
  Account,
  saveAccount,
} from "@/identity/entities";
import {
  AccountContactMethodChangeError,
  AccountContactNotAllowedError,
} from "@/identity/errors";

import { AddAccountContactDTO } from "./add-contact";

export const UpdateAccountContactDTO = AddAccountContactDTO;

export const updateAccountContact = async (
  accountId: string,
  contactId: string,
  dto: z.infer<typeof UpdateAccountContactDTO>
): Promise<
  Result<
    Contact | null,
    AccountContactMethodChangeError | AccountContactNotAllowedError
  >
> => {
  const account = (await loadAccountById(accountId))!;

  const existingContact = account.contacts.find(
    (contact) => contact.id === contactId
  );

  if (!existingContact) {
    return ok(null);
  }

  if (existingContact.method !== dto.method) {
    return err({
      type: "AccountContactMethodChangeError",
    });
  }

  if (dto.method === "phone" && existingContact.method === "phone") {
    return err({
      type: "AccountContactNotAllowedError",
      message: "Cannot change primary phone contact",
    });
  }

  const updatedContact: Contact = Contact.parse({
    ...existingContact,
    ...(dto.label ? { label: dto.label } : {}),
    method: dto.method,
    ...(dto.method === "phone" ? { phone_number: dto.phone_number } : {}),
    ...(dto.method === "email" ? { email: dto.email } : {}),
  });

  const updatedAccount: Account = {
    ...account,
    contacts: account.contacts.map((cnt) =>
      cnt.id === updatedContact.id ? updatedContact : cnt
    ),
  };

  await saveAccount(updatedAccount);

  return ok(updatedContact);
};
