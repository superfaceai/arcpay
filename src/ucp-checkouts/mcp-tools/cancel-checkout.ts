import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { loadAccountById } from "@/identity/entities";

import { cancelCheckoutSession } from "@/ucp-checkouts/adapters";
import { mapCheckoutResponse } from "../services";
import { getArcPayPlatformProfileURL } from "@/ucp-checkouts/values/profile";
import { CheckoutWithFulfillmentResponse } from "@/ucp/interfaces";

const inputSchema = {
  ucpBaseUrl: z.string().url().describe("The base URL of the Merchant UCP"),
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
    async ({ ucpBaseUrl, checkoutId }) => {
      try {
        const profileUrl = getArcPayPlatformProfileURL(context.hostUrl);

        const account = (await loadAccountById(context.accountId))!;

        const checkoutResult = await cancelCheckoutSession({
          ucpUrl: ucpBaseUrl,
          profileUrl,
          checkoutSessionId: checkoutId,
        });

        if (!checkoutResult.ok) {
          if (checkoutResult.error.type === "UCPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(checkoutResult.error.error),
            });
          }

          return toolResponse({
            error: checkoutResult.error.message ?? "Unknown error",
          });
        }

        const fulfillmentDestination =
          "fulfillment" in checkoutResult.value
            ? (checkoutResult.value as CheckoutWithFulfillmentResponse).fulfillment?.methods
                ?.find((m) => m.type === "shipping")
                ?.destinations?.[0]
            : undefined;

        const publicCheckoutResult = mapCheckoutResponse(
          checkoutResult.value,
          fulfillmentDestination
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

