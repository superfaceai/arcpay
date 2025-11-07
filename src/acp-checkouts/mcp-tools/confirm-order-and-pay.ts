import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import {
  completeCheckoutSession,
  getCheckoutSession,
} from "@/acp-checkouts/adapters";

const inputSchema = {
  acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
  checkoutId: z.string().describe("The checkout ID"),
};
const outputSchema = { checkout: z.unknown().describe("The checkout state") };

export const confirmOrderAndPayTool = createMcpTool(
  "confirm-order-and-pay",
  {
    title: "Confirm Order and Pay",
    description: "Complete a checkout session and pay for the order",
    inputSchema,
    outputSchema,
  },
  () =>
    async ({ acpBaseUrl, checkoutId }) => {
      try {
        console.info("Confirming order and paying", { acpBaseUrl, checkoutId });

        const checkoutSessionResult = await getCheckoutSession({
          acpUrl: acpBaseUrl,
          checkoutSessionId: checkoutId,
        });

        if (!checkoutSessionResult.ok) {
          if (checkoutSessionResult.error.type === "ACPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(checkoutSessionResult.error.error),
            });
          }

          return toolResponse({
            error: checkoutSessionResult.error.message ?? "Unknown error",
          });
        }

        // TODO: Validate the order

        // TODO: Create a payment mandate
        const grantedMandateSecret = "paym_secret_1234567890";

        const completeCheckoutResult = await completeCheckoutSession({
          acpUrl: acpBaseUrl,
          checkoutSessionId: checkoutId,
          request: {
            payment_data: {
              token: grantedMandateSecret,
              provider: checkoutSessionResult.value.payment_provider.provider,
            },
          },
        });

        if (!completeCheckoutResult.ok) {
          if (completeCheckoutResult.error.type === "ACPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(completeCheckoutResult.error.error),
            });
          }

          return toolResponse({
            error: completeCheckoutResult.error.message ?? "Unknown error",
          });
        }

        return toolResponse({
          structuredContent: {
            checkout: completeCheckoutResult.value,
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
