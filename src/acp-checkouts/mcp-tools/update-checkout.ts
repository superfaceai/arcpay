import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { updateCheckoutSession } from "@/acp-checkouts/adapters";

const inputSchema = {
  acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
  checkoutId: z.string().describe("The checkout session ID"),
  fulfillmentOptionId: z
    .string()
    .optional()
    .describe(
      "The fulfillment option ID to select for the checkout to override the default fulfillment option"
    ),
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
  async ({ acpBaseUrl, checkoutId, fulfillmentOptionId, products }) => {
    try {
      console.info("Updating existing checkout", {
        acpBaseUrl,
        checkoutId,
        fulfillmentOptionId,
        products,
      });

      const checkoutResult = await updateCheckoutSession({
        acpUrl: acpBaseUrl,
        checkoutSessionId: checkoutId,
        request: {
          items: products,
          ...(fulfillmentOptionId
            ? { fulfillment_option_id: fulfillmentOptionId }
            : {}),

          // TODO: Map address from account
          fulfillment_address: {
            name: "John Doe",
            line_one: "123 Main St",
            city: "Anytown",
            state: "CA",
            country: "US",
            postal_code: "12345",
          },
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

      return toolResponse({
        structuredContent: {
          // TODO: remove fulfillment_address from the response
          checkout: checkoutResult.value,
        },
      });
    } catch (e) {
      console.error(e);
      return toolResponse({ error: "Internal error" });
    }
  }
);
