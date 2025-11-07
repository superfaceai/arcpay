import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { loadAccountById } from "@/identity/entities";
import {
  completeCheckoutSession,
  getCheckoutSession,
} from "@/acp-checkouts/adapters";
import { mapCheckoutResponse } from "../services";

const inputSchema = {
  acpBaseUrl: z.string().url().describe("The base URL of the Merchant ACP"),
  checkoutId: z.string().describe("The checkout ID"),
  preauthorizedPayment: z.object({
    token: z.string().describe("The token of the payment mandate"),
    provider: z.enum(["arcpay"]).describe("The payment provider"),
  }),
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
  (context) =>
    async ({ acpBaseUrl, checkoutId, preauthorizedPayment }) => {
      try {
        console.info("Confirming order and paying", { acpBaseUrl, checkoutId });

        const account = (await loadAccountById(context.accountId))!;

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

        if (checkoutSessionResult.value.status === "not_ready_for_payment") {
          return toolResponse({
            error: `The checkout session is not yet ready for payment. Make sure to provide valid fulfillment option, and address potential errors in 'messages' field`,
          });
        }

        const completeCheckoutResult = await completeCheckoutSession({
          acpUrl: acpBaseUrl,
          checkoutSessionId: checkoutId,
          request: {
            payment_data: {
              token: preauthorizedPayment.token,
              provider: preauthorizedPayment.provider,
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

        const publicCheckoutResult = mapCheckoutResponse(
          completeCheckoutResult.value,
          checkoutSessionResult.value.fulfillment_address
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
