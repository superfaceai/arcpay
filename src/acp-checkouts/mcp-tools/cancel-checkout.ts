import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { loadAccountById } from "@/identity/entities";

import { cancelCheckoutSession } from "@/acp-checkouts/adapters";
import { mapCheckoutResponse } from "../services";

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
  (context) =>
    async ({ acpBaseUrl, checkoutId }) => {
      try {
        console.info("Cancelling checkout", { acpBaseUrl, checkoutId });
        const account = (await loadAccountById(context.accountId))!;

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

        const publicCheckoutResult = mapCheckoutResponse(
          checkoutResult.value,
          checkoutResult.value.fulfillment_address
            ? { addresses: account.addresses }
            : undefined
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
