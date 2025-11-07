import { Address } from "@/identity/entities";

export const chooseShippingAddress = ({
  addresses,
  fulfillmentAddressId,
}: {
  addresses: Address[];
  fulfillmentAddressId?: string;
}): { type: "choice"; address: Address } | { type: "error"; error: string } => {
  const shippingAddresses = addresses.filter((address) =>
    address.purposes.includes("shipping")
  );

  const shippingAddress = fulfillmentAddressId
    ? shippingAddresses.find((address) => address.id === fulfillmentAddressId)
    : shippingAddresses[0]; // or have a manually set default address

  if (!shippingAddress) {
    return {
      type: "error",
      error: "No shipping address found, please list addresses and select one",
    };
  }

  return {
    type: "choice",
    address: shippingAddress,
  };
};
