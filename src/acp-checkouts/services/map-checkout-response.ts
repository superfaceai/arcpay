import { Address } from "@/identity/entities";
import {
  CheckoutSession as AcpCheckoutSession,
  Address as AcpAddress,
} from "@/acp-checkouts/interfaces/schema";
import { mapAddressToACP } from "./map-address";

export type PublicCheckoutSession = Omit<
  AcpCheckoutSession,
  "fulfillment_address"
> & {
  fulfillment_address_id?: string;
  fulfillment_address_label?: string;
};

export const mapCheckoutResponse = (
  response: AcpCheckoutSession,
  address: { id: string; label: string } | { addresses: Address[] } | undefined
):
  | { type: "checkout"; checkout: PublicCheckoutSession }
  | { type: "error"; error: string } => {
  const { fulfillment_address, ...responseWithoutAddress } = response;

  if (!address) {
    return {
      type: "checkout",
      checkout: {
        ...responseWithoutAddress,
      },
    };
  }

  let fulfillmentAddressId: string | undefined;
  let fulfillmentAddressLabel: string | undefined;

  if ("id" in address) {
    fulfillmentAddressId = address.id;
    fulfillmentAddressLabel = address.label;
  } else {
    if (response.fulfillment_address) {
      const matchingAddress = address.addresses.find((a) =>
        matchAddress(a, response.fulfillment_address!)
      );

      if (matchingAddress) {
        fulfillmentAddressId = matchingAddress.id;
        fulfillmentAddressLabel = matchingAddress.label;
      } else {
        return {
          type: "error",
          error:
            "Cannot resolve fulfillment address, please select a different address or start new checkout",
        };
      }
    }
  }

  return {
    type: "checkout",
    checkout: {
      ...responseWithoutAddress,
      fulfillment_address_id: fulfillmentAddressId,
      fulfillment_address_label: fulfillmentAddressLabel,
    },
  };
};

const matchAddress = (address: Address, acpAddress: AcpAddress): boolean => {
  const addressAsAcpAddress = mapAddressToACP(address);

  return JSON.stringify(addressAsAcpAddress) === JSON.stringify(acpAddress);
};
