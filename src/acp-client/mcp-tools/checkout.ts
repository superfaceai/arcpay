import { z } from "zod/v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

export const checkoutTool = createMcpTool(
  "checkout",
  {
    title: "Checkout",
    description: "Checkout a cart to complete the purchase",
    inputSchema: {
      acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
      cartId: z.string().describe("The cart ID"),
    },
    outputSchema: { products: z.unknown().describe("The products feed") },
  },
  async ({ acpBaseUrl, cartId }) => {
    try {
      console.info("Checking out cart", { acpBaseUrl, cartId });

      return toolResponse({
        content: "Cart checked out",
      });
    } catch (e) {
      console.error(e);
      return toolResponse({ error: "Internal error" });
    }
  }
);
