import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { getPermissionReadingByToken } from "@/wallet/entities";

const inputSchema = {
  permissionToken: z
    .string()
    .describe(
      "The permission token that signifies you have read and follow the permissions. If uknown, call 'read-permissions' to get first."
    ),
  paymentMethod: z.enum(["wallet"]),
  paymentProvider: z.enum(["arcpay"]),
  amount: z.number().describe("The amount to preauthorize"),
  currency: z
    .string()
    .transform((c) => c.toUpperCase().trim())
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

        return toolResponse({
          structuredContent: {
            paymentMandateSecretToken:
              "paym_secret_1234567890123456789012345678901234567890",
            expirationInMinutes: 5,
            paymentProvider: "arcpay",
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
