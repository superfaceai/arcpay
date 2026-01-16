import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { loadAccountById } from "@/identity/entities";
import {
  completeCheckoutSession,
  getCheckoutSession,
} from "@/ucp-checkouts/adapters";
import { mapCheckoutResponse } from "../services";
import {
  PaymentData,
  CheckoutWithFulfillmentResponse,
  ArcPayWalletPaymentInstrument,
} from "@/ucp/interfaces";
import { getArcPayPlatformProfileURL } from "@/ucp-checkouts/values/profile";

const inputSchema = {
  ucpBaseUrl: z.string().url().describe("The base URL of the Merchant UCP"),
  checkoutId: z.string().describe("The checkout ID"),
  preauthorizedPayment: z.object({
    referenceId: z
      .string()
      .describe(
        "The reference identifier of the payment mandate, e.g. ID. Never use a secret for this."
      ),
    token: z.string().describe("The token of the payment mandate"),
    expiresAt: z
      .string()
      .describe(
        "The date and time the payment mandate expires at, in ISO 8601 format"
      ),
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
    async ({ ucpBaseUrl, checkoutId, preauthorizedPayment }) => {
      try {
        const profileUrl = getArcPayPlatformProfileURL(context.hostUrl);

        const account = (await loadAccountById(context.accountId))!;

        const checkoutSessionResult = await getCheckoutSession({
          ucpUrl: ucpBaseUrl,
          profileUrl,
          checkoutSessionId: checkoutId,
        });

        if (!checkoutSessionResult.ok) {
          if (checkoutSessionResult.error.type === "UCPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(checkoutSessionResult.error.error),
            });
          }

          return toolResponse({
            error: checkoutSessionResult.error.message ?? "Unknown error",
          });
        }

        if (checkoutSessionResult.value.status !== "ready_for_complete") {
          return toolResponse({
            error: `The checkout session is not yet ready for payment. Current status: ${checkoutSessionResult.value.status}. Make sure to provide valid fulfillment option, and address potential errors in 'messages' field`,
          });
        }

        // Create payment instrument from token
        // Using wallet payment instrument structure for ArcPay
        const paymentInstrument: ArcPayWalletPaymentInstrument = {
          id: preauthorizedPayment.referenceId,
          handler_id: "arcpay",
          type: "wallet" as const,
          credential: {
            type: "arcpay_mandate" as const,
            token: preauthorizedPayment.token,
            expires_at: preauthorizedPayment.expiresAt,
          },
        };

        const completeCheckoutResult = await completeCheckoutSession({
          ucpUrl: ucpBaseUrl,
          profileUrl,
          checkoutSessionId: checkoutId,
          request: {
            id: checkoutId,
            payment_data: paymentInstrument,
          },
        });

        if (!completeCheckoutResult.ok) {
          if (completeCheckoutResult.error.type === "MinimalUCPReport") {
            return toolResponse({
              error: `[${completeCheckoutResult.error.checkoutStatus}]: ${completeCheckoutResult.error.message}`,
            });
          }

          if (completeCheckoutResult.error.type === "UCPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(completeCheckoutResult.error.error),
            });
          }

          return toolResponse({
            error: completeCheckoutResult.error.message ?? "Unknown error",
          });
        }

        const fulfillmentDestination =
          "fulfillment" in checkoutSessionResult.value
            ? (
                checkoutSessionResult.value as CheckoutWithFulfillmentResponse
              ).fulfillment?.methods?.find((m) => m.type === "shipping")
                ?.destinations?.[0]
            : undefined;

        const publicCheckoutResult = mapCheckoutResponse(
          completeCheckoutResult.value,
          fulfillmentDestination ? { addresses: account.addresses } : undefined
        );
        if (publicCheckoutResult.type === "error") {
          return toolResponse({ error: publicCheckoutResult.error });
        }

        const { id, ...checkoutWithoutId } = publicCheckoutResult.checkout;
        return toolResponse({
          structuredContent: {
            checkout: {
              ...checkoutWithoutId,
              checkoutId: id,
            },
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
