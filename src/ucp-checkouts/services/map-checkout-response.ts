import { Address } from "@/identity/entities";
import {
  CheckoutResponse,
  CheckoutWithFulfillmentResponse,
  ShippingDestinationResponse,
} from "@/ucp/interfaces";
import { mapAddressToUCP } from "./map-address";

export type PublicCheckoutSession = Omit<
  CheckoutResponse,
  "ucp" | "payment"
> & {
  fulfillment_address_id?: string;
  fulfillment_address_label?: string;
};

export const mapCheckoutResponse = (
  response: CheckoutResponse | CheckoutWithFulfillmentResponse,
  address: { id: string; label: string } | { addresses: Address[] } | undefined
):
  | { type: "checkout"; checkout: PublicCheckoutSession }
  | { type: "error"; error: string } => {
  // UCP uses fulfillment.methods[].destinations[] instead of fulfillment_address
  // We'll extract the first shipping destination if available
  const fulfillmentDestination =
    "fulfillment" in response
      ? (response.fulfillment?.methods?.find((m) => m.type === "shipping")
          ?.destinations?.[0] as ShippingDestinationResponse | undefined)
      : undefined;

  // Omit ucp and payment properties from the response
  const { ucp, payment, ...responseWithoutUcpAndPayment } = response;

  // Transform fulfillment destinations to only include id
  if (
    "fulfillment" in responseWithoutUcpAndPayment &&
    responseWithoutUcpAndPayment.fulfillment
  ) {
    responseWithoutUcpAndPayment.fulfillment = {
      ...responseWithoutUcpAndPayment.fulfillment,
      methods: responseWithoutUcpAndPayment.fulfillment.methods?.map(
        (method) => ({
          ...method,
          destinations: method.destinations?.map((destination) => ({
            id: destination.id,
          })),
        })
      ),
      available_methods:
        responseWithoutUcpAndPayment.fulfillment.available_methods,
    };
  }

  let fulfillmentAddressId: string | undefined;
  let fulfillmentAddressLabel: string | undefined;

  // Only map fulfillment address if there's a destination in the response
  if (fulfillmentDestination) {
    // Need addresses list to match against
    if (!address || "id" in address) {
      // If no addresses list provided, can't match
      return {
        type: "checkout",
        checkout: {
          ...responseWithoutUcpAndPayment,
        },
      };
    }

    // First try to match by ID if the destination has an ID
    let matchingAddress: Address | undefined;

    if (fulfillmentDestination.id) {
      matchingAddress = address.addresses.find(
        (a) => a.id === fulfillmentDestination.id
      );
    }

    // If no match by ID, fall back to address lines matching
    if (!matchingAddress) {
      matchingAddress = address.addresses.find((a) =>
        matchAddress(a, fulfillmentDestination)
      );
    }

    if (matchingAddress) {
      // Retrieve ID and label from our addresses list
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

  // Only include fulfillment_address_id and fulfillment_address_label if they were found
  const checkout: PublicCheckoutSession = {
    ...responseWithoutUcpAndPayment,
  };

  if (fulfillmentAddressId !== undefined) {
    checkout.fulfillment_address_id = fulfillmentAddressId;
  }
  if (fulfillmentAddressLabel !== undefined) {
    checkout.fulfillment_address_label = fulfillmentAddressLabel;
  }

  return {
    type: "checkout",
    checkout,
  };
};

const matchAddress = (
  address: Address,
  ucpAddress: ShippingDestinationResponse
): boolean => {
  const addressAsUcpAddress = mapAddressToUCP(address);

  return (
    addressAsUcpAddress.street_address === ucpAddress.street_address &&
    addressAsUcpAddress.extended_address === ucpAddress.extended_address &&
    addressAsUcpAddress.address_locality === ucpAddress.address_locality &&
    addressAsUcpAddress.address_region === ucpAddress.address_region &&
    addressAsUcpAddress.address_country === ucpAddress.address_country &&
    addressAsUcpAddress.postal_code === ucpAddress.postal_code
  );
};
