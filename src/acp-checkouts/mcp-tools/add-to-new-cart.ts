import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { createCheckoutSession } from "@/acp-checkouts/adapters";

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
  async ({ acpBaseUrl, products }) => {
    try {
      console.info("Adding products to cart", {
        acpBaseUrl,
        products,
      });

      const cartResult = await createCheckoutSession({
        acpUrl: acpBaseUrl,
        request: {
          items: products,

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

      return toolResponse({
        structuredContent: {
          // TODO: remove fulfillment_address from the response
          checkout: cartResult.value,
        },
      });
    } catch (e) {
      console.error(e);
      return toolResponse({ error: "Internal error" });
    }
  }
);
