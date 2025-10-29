import { z } from "zod-v3";

import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";
import { Currency } from "@/balances/values";
import { withAuth } from "@/api/middlewares";
import { getBalance } from "@/balances/services";

export const walletsMcp = createApi().all(
  "/mcp/wallets",
  withAuth(),
  async (c) => {
    const accountId = c.get("accountId");
    const live = c.get("isLive");

    const mcpServer = createMcpServer({
      name: "wallets",
      title: "Wallets MCP",
    });

    mcpServer.registerTool(
      "get-balance",
      {
        title: "Get Balance",
        description: "Get the current balance",
        inputSchema: {
          currency: z
            .string()
            .transform((val) => val.toUpperCase().trim())
            .pipe(z.enum(Currency.options as [string, ...string[]]))
            .describe("The currency to get the balance for"),
        },
        outputSchema: { amount: z.string(), currency: z.string() },
      },
      async ({ currency }) => {
        const balance = await getBalance({
          accountId,
          live,
          currency: currency as Currency,
        });

        if (!balance.ok) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: balance.error.message }),
              },
            ],
            structuredContent: { error: balance.error.message },
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                amount: balance.value?.amount ?? "0",
                currency,
              }),
            },
          ],
          structuredContent: {
            amount: balance.value?.amount ?? "0",
            currency,
          },
        };
      }
    );

    return handleMcpRequest(mcpServer, c);
  }
);
