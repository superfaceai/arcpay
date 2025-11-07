import { Address } from "@/identity/entities";
import { Address as AcpAddress } from "@/acp-checkouts/interfaces/schema";

export const mapAddressToACP = (address: Address): AcpAddress => {
  return {
    name: address.name,
    line_one: address.line_one,
    line_two: address.line_two,
    city: address.city,
    state: address.state ?? "",
    country: address.country,
    postal_code: address.zip,
    phone_number: address.phone_number,
  };
};
