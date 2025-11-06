import { z } from "zod/v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

export const listProductsTool = createMcpTool(
  "list-products",
  {
    title: "List Products (non-ACP)",
    description: "List product feed via URL",
    inputSchema: {
      url: z.string().url().describe("The URL of the product feed"),
    },
    outputSchema: { products: z.unknown().describe("The products feed") },
  },
  async ({ url }) => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        return toolResponse({
          error: `Product feed request failed with status ${response.status}`,
        });
      }

      const products = await response.text();

      if (response.headers.get("content-type")?.includes("application/json")) {
        const productsJson = (function () {
          try {
            return JSON.parse(products);
          } catch (e) {
            return products;
          }
        })();
        return toolResponse({
          structuredContent: { products: productsJson },
        });
      }

      return toolResponse({
        content: products,
      });
    } catch (e) {
      console.error(e);
      return toolResponse({ error: "Internal error" });
    }
  }
);
