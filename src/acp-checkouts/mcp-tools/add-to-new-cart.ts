import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { loadAccountById } from "@/identity/entities";
import { createCheckoutSession } from "@/acp-checkouts/adapters";
import {
  mapCheckoutResponse,
  mapAddressToACP,
  chooseShippingAddress,
} from "@/acp-checkouts/services";

const inputSchema = {
  acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
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
    .describe("The products to add to the cart"),
  fulfillmentAddressId: z
    .string()
    .optional()
    .describe("The fulfillment address ID to use for the checkout"),
};
const outputSchema = { checkout: z.unknown().describe("Current cart state") };

export const addToNewCartTool = createMcpTool(
  "add-to-new-cart",
  {
    title: "Add to New Cart",
    description: "Add products into a new checkout session",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({ acpBaseUrl, products, fulfillmentAddressId }) => {
      try {
        console.info("Adding products to cart", {
          acpBaseUrl,
          products,
        });

        const account = (await loadAccountById(context.accountId))!;

        const shippingAddressChoice = chooseShippingAddress({
          addresses: account.addresses,
          fulfillmentAddressId,
        });

        if (shippingAddressChoice.type === "error") {
          return toolResponse({ error: shippingAddressChoice.error });
        }

        const shippingAddress = shippingAddressChoice.address;

        console.info("Selected shipping address", { shippingAddress });

        const cartResult = await createCheckoutSession({
          acpUrl: acpBaseUrl,
          request: {
            items: products,
            fulfillment_address: mapAddressToACP(shippingAddress),
          },
        });

        if (!cartResult.ok) {
          if (cartResult.error.type === "ACPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(cartResult.error.error),
            });
          }

          return toolResponse({
            error: cartResult.error.message ?? "Unknown error",
          });
        }

        const publicCheckoutResult = mapCheckoutResponse(cartResult.value, {
          id: shippingAddress.id,
          label: shippingAddress.label,
        });
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
