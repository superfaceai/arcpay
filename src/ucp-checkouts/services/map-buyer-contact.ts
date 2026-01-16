import { Account } from "@/identity/entities";
import { Buyer } from "@/ucp/interfaces";

export const mapBuyerContact = (account: Account): Buyer | undefined => {
  const full_name = account.name.trim();

  // Get email from contacts
  const email = account.contacts.find(
    (contact) => contact.method === "email"
  )?.email;

  // Get phone number from contacts
  const phone_number = account.contacts.find(
    (contact) => contact.method === "phone"
  )?.phone_number;

  // Only return Buyer if we have at least some contact data
  if (!email && !phone_number) {
    return undefined;
  }

  return {
    full_name,
    email,
    phone_number,
  };
};
