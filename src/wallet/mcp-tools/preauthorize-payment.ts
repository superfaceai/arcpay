import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { getPermissionReadingByToken } from "@/wallet/entities";
import { delegatePayment } from "@/payments/services";

const minute = 60 * 1000;

const EXPIRE_AFTER_MINUTES = 5;

const inputSchema = {
  permissionToken: z
    .string()
    .describe(
      "The permission token that signifies you have read and follow the permissions. If uknown, call 'read-permissions' to get first."
    ),
  paymentMethod: z.enum(["wallet"]),
  paymentProvider: z.enum(["arcpay"]),
  amount: z
    .string()
    .describe(
      "The amount to preauthorize, in the currency specified, with . separator for decimals"
    ),
  currency: z
    .string()
    .transform((c) => c.toUpperCase().trim())
    .transform((c) => (c === "USD" ? "USDC" : c))
    .transform((c) => (c === "EUR" ? "EURC" : c))
    .pipe(z.enum(["USDC", "EURC", "POL", "ETH", "AVAX", "SOL"]))
    .describe("The currency to preauthorize"),
  paymentPurpose: z.array(z.enum(["food", "beverages", "stationary", "other"])),
};

const outputSchema = {
  paymentMandateSecretToken: z
    .string()
    .describe("The secret token of the payment mandate"),
  expirationInMinutes: z
    .number()
    .describe("The number of minutes until the payment mandate expires."),
  expiresAt: z
    .string()
    .optional()
    .describe("The date and time the payment mandate expires at"),
  paymentProvider: z.enum(["arcpay"]).describe("The payment provider to use"),
};

export const preauthorizePaymentTool = createMcpTool(
  "preauthorize-payment",
  {
    title: "Preauthorize Payment",
    description: "Preauthorize a payment for the current account",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({ permissionToken, amount, currency, paymentPurpose }) => {
      try {
        if (!(await getPermissionReadingByToken(permissionToken))) {
          return toolResponse({
            error:
              "The permission token is invalid or expired. Call 'read-permissions' to get first.",
          });
        }

        console.info("Preauthorizing payment", {
          permissionToken,
          amount,
          currency,
          paymentPurpose,
        });

        const delegatePaymentResult = await delegatePayment({
          accountId: context.accountId,
          live: context.live,
          dto: {
            type: "single_use",
            single_use: {
              amount_limit: amount,
              currency,
            },
            method: "arcpay",
            expires_at: new Date(Date.now() + EXPIRE_AFTER_MINUTES * minute),
            metadata: {
              purpose: paymentPurpose.join(", "),
            },
          },
        });

        if (!delegatePaymentResult.ok) {
          if (
            delegatePaymentResult.error.type ===
            "PaymentInsufficientBalanceError"
          ) {
            return toolResponse({
              error: `You do not have enough ${delegatePaymentResult.error.currency} to pay ${delegatePaymentResult.error.requiredAmount}, refer to permissions`,
            });
          }
          if (
            delegatePaymentResult.error.type === "PaymentMandateExpiredError"
          ) {
            return toolResponse({
              error: `The expiration date of the mandate has passed`,
            });
          }
          if (
            delegatePaymentResult.error.type ===
            "PaymentUnsupportedPaymentMethodError"
          )
            return toolResponse({
              error: `The payment method '${delegatePaymentResult.error.method}' is not supported`,
            });
          if (
            delegatePaymentResult.error.type === "BlockchainWalletActionError"
          )
            return toolResponse({
              error: delegatePaymentResult.error.message ?? "Unknown error",
            });

          return toolResponse({
            error: "Unknown error",
          });
        }

        return toolResponse({
          structuredContent: {
            paymentMandateSecretToken: delegatePaymentResult.value.secret,
            paymentProvider: "arcpay",
            expirationInMinutes: EXPIRE_AFTER_MINUTES,
            ...(delegatePaymentResult.value.expires_at
              ? {
                  expiresAt:
                    delegatePaymentResult.value.expires_at.toISOString(),
                }
              : {}),
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
