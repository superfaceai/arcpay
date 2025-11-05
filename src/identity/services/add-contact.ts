import { z } from "zod";
import { err, ok, PhoneNumber, Result } from "@/lib";

import {
  Contact,
  loadAccountById,
  contactId,
  Account,
  saveAccount,
} from "@/identity/entities";
import { AccountPrimaryContactAlreadyExistsError } from "../errors";

const AddContactBase = z.object({
  label: z.string().optional(),
});
const AddContactPhone = AddContactBase.extend({
  method: z.literal(["phone"]),
  phone_number: PhoneNumber,
});
const AddContactEmail = AddContactBase.extend({
  method: z.literal(["email"]),
  email: z.email(),
});
export const AddAccountContactDTO = z.discriminatedUnion("method", [
  AddContactPhone,
  AddContactEmail,
]);

export const addAccountContact = async (
  accountId: string,
  dto: z.infer<typeof AddAccountContactDTO>
): Promise<Result<Contact, AccountPrimaryContactAlreadyExistsError>> => {
  const account = (await loadAccountById(accountId))!;

  const existingContact = account.contacts.find(
    (contact) => contact.method === dto.method
  );

  if (existingContact) {
    // We only allow one contact per method for now.
    // Later we can allow multiple contacts per method, and have a concept of primary contact.
    return err({
      type: "AccountPrimaryContactAlreadyExistsError",
      contact: existingContact,
    });
  }

  const newContact = Contact.parse({
    id: contactId(),
    ...(dto.label ? { label: dto.label } : {}),
    method: dto.method,
    ...(dto.method === "phone" ? { phone_number: dto.phone_number } : {}),
    ...(dto.method === "email" ? { email: dto.email } : {}),
  });

  const updatedAccount: Account = {
    ...account,
    contacts: [...account.contacts, newContact],
  };

  await saveAccount(updatedAccount);

  return ok(newContact);
};
