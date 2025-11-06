import { z } from "zod/v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

export const cancelCartTool = createMcpTool(
  "cancel-cart",
  {
    title: "Cancel/Abandon Cart",
    description: "Cancel or abandon a cart or a checkout session",
    inputSchema: {
      acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
      cartId: z.string().describe("The cart ID or checkout session ID"),
    },
    outputSchema: { products: z.unknown().describe("The products feed") },
  },
  async ({ acpBaseUrl, cartId }) => {
    try {
      console.info("Cancelling cart", { acpBaseUrl, cartId });

      return toolResponse({
        content: "Cart cancelled",
      });
    } catch (e) {
      console.error(e);
      return toolResponse({ error: "Internal error" });
    }
  }
);
