import { z } from "zod/v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

export const addToCartTool = createMcpTool(
  "add-to-cart",
  {
    title: "Add to Cart",
    description: "Add or udpate products in the cart",
    inputSchema: {
      acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
      existingCartId: z
        .string()
        .optional()
        .describe("The cart ID (only for updating existing carts)"),
      products: z
        .array(
          z.object({
            id: z.string().describe("The product ID"),
            quantity: z
              .number()
              .int()
              .positive()
              .describe("The quantity of the product"),
          })
        )
        .describe("The products to add to the cart"),
    },
    outputSchema: { products: z.unknown().describe("The products feed") },
  },
  async ({ acpBaseUrl, existingCartId, products }) => {
    try {
      console.info("Adding products to cart", {
        acpBaseUrl,
        existingCartId,
        products,
      });

      return toolResponse({
        content: "Products added to cart",
      });
    } catch (e) {
      console.error(e);
      return toolResponse({ error: "Internal error" });
    }
  }
);
