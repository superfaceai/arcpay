import { Address } from "@/identity/entities";
import { PostalAddress } from "@/ucp/interfaces";

export const mapAddressToUCP = (address: Address): PostalAddress => {
  return {
    id: address.id,
    first_name: address.name.split(" ")[0] || address.name,
    last_name: address.name.split(" ").slice(1).join(" ") || undefined,
    full_name: address.name,
    street_address: address.line_one,
    extended_address: address.line_two,
    address_locality: address.city,
    address_region: address.state ?? undefined,
    address_country: address.country,
    postal_code: address.zip,
    phone_number: address.phone_number,
  };
};

