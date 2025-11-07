import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { updateCheckoutSession } from "@/acp-checkouts/adapters";
import { Address, loadAccountById } from "@/identity/entities";
import {
  chooseShippingAddress,
  mapAddressToACP,
  mapCheckoutResponse,
} from "../services";

const inputSchema = {
  acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
  checkoutId: z.string().describe("The checkout session ID"),
  fulfillmentOptionId: z
    .string()
    .optional()
    .describe(
      "The fulfillment option ID to select for the checkout to override the default fulfillment option"
    ),
  fulfillmentAddressId: z
    .string()
    .optional()
    .describe("The fulfillment address ID to use for the checkout"),
  products: z
    .array(
      z.object({
        id: z.string().describe("The product ID, or variant ID"),
        quantity: z
          .number()
          .int()
          .positive()
          .describe("The quantity of the product"),
      })
    )
    .describe("The products to hold in the cart"),
};
const outputSchema = {
  checkout: z.unknown().describe("Current checkout state"),
};

export const updateCheckoutTool = createMcpTool(
  "update-checkout",
  {
    title: "Update Checkout",
    description:
      "Update the quantity of products in a checkout, or add products to a checkout",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({
      acpBaseUrl,
      checkoutId,
      fulfillmentOptionId,
      products,
      fulfillmentAddressId,
    }) => {
      try {
        console.info("Updating existing checkout", {
          acpBaseUrl,
          checkoutId,
          fulfillmentOptionId,
          products,
        });
        const account = (await loadAccountById(context.accountId))!;

        let newFulfillmentAddress: Address | undefined;
        if (fulfillmentAddressId) {
          const shippingAddressChoice = chooseShippingAddress({
            addresses: account.addresses,
            fulfillmentAddressId,
          });
          if (shippingAddressChoice.type === "error") {
            return toolResponse({ error: shippingAddressChoice.error });
          }
          newFulfillmentAddress = shippingAddressChoice.address;
        }

        const checkoutResult = await updateCheckoutSession({
          acpUrl: acpBaseUrl,
          checkoutSessionId: checkoutId,
          request: {
            items: products,

            ...(fulfillmentOptionId
              ? { fulfillment_option_id: fulfillmentOptionId }
              : {}),

            ...(newFulfillmentAddress
              ? { fulfillment_address: mapAddressToACP(newFulfillmentAddress) }
              : {}),
          },
        });

        if (!checkoutResult.ok) {
          if (checkoutResult.error.type === "ACPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(checkoutResult.error.error),
            });
          }

          return toolResponse({
            error: checkoutResult.error.message ?? "Unknown error",
          });
        }

        const publicCheckoutResult = mapCheckoutResponse(
          checkoutResult.value,
          newFulfillmentAddress
            ? {
                id: newFulfillmentAddress.id,
                label: newFulfillmentAddress.label,
              }
            : {
                addresses: account.addresses,
              }
        );
        if (publicCheckoutResult.type === "error") {
          return toolResponse({ error: publicCheckoutResult.error });
        }

        return toolResponse({
          structuredContent: {
            checkout: publicCheckoutResult.checkout,
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
