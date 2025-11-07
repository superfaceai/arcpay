import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { cancelCheckoutSession } from "@/acp-checkouts/adapters";

const inputSchema = {
  acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
  checkoutId: z.string().describe("The checkout session ID"),
};
const outputSchema = {
  checkout: z.unknown().describe("Current checkout state"),
};

export const cancelCheckoutTool = createMcpTool(
  "cancel-checkout",
  {
    title: "Cancel/Abandon Checkout",
    description: "Cancel or abandon a checkout session",
    inputSchema,
    outputSchema,
  },
  () =>
    async ({ acpBaseUrl, checkoutId }) => {
      try {
        console.info("Cancelling checkout", { acpBaseUrl, checkoutId });

        const checkoutResult = await cancelCheckoutSession({
          acpUrl: acpBaseUrl,
          checkoutSessionId: checkoutId,
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
