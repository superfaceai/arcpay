import { z } from "zod-v3";
import { createMcpTool, toolResponse } from "@/mcp/services";

import { Currency } from "@/balances/values";
import { getBalance } from "@/balances/services";

const inputSchema = {
  currency: z
    .string()
    .transform((val) => val.toUpperCase().trim())
    .pipe(z.enum(Currency.options as [string, ...string[]]))
    .describe("The currency to get the balance for"),
};
const outputSchema = { amount: z.string(), currency: z.string() };

export const getBalanceTool = createMcpTool(
  "get-balance",
  {
    title: "Get Balance",
    description: "Get the current balance",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({ currency }) => {
      try {
        const balance = await getBalance({
          accountId: context.accountId,
          live: context.live,
          currency: currency as Currency,
        });

        if (!balance.ok) {
          return toolResponse({ error: balance.error.message });
        }

        return toolResponse({
          structuredContent: {
            amount: balance.value?.amount ?? "0",
            currency,
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
