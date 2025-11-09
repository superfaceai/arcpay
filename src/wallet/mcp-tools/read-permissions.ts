import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { getBalance, listBalances } from "@/balances/services";
import { listAgents, withRemainingAllowance } from "@/identity/entities";

const outputSchema = {
  permissionToken: z
    .string()
    .describe(
      "The permission token you need to use to interact with the wallet."
    ),
  permissionExpirationMinutes: z
    .number()
    .describe("The number of minutes until the permission token expires."),
  rules: z.array(z.string()),
  balances: z.array(
    z.object({
      currency: z.string(),
      budgetLimit: z.string(),
      remainingBudget: z.string(),
      budgetResetsInDays: z.number(),
    })
  ),
};

export const readPermissionsTool = createMcpTool(
  "read-permissions",
  {
    title: "Read Permissions",
    description:
      "Get details about my permissions for the wallet. I need to behave accordingly.",
    outputSchema,
  },
  (context) =>
    async ({}) => {
      try {
        const agents = await listAgents({ accountId: context.accountId });

        if (!agents.length) {
          return toolResponse({
            structuredContent: {
              permissionToken: "i_have_read_permissions_RpMFWVAmFPOSvrByDEYgs",
              permissionExpirationMinutes: 5,
              rules: [
                "You are not authorized to use this wallet, cancel all purchasing flows now",
              ],
              balances: [],
            },
          });
        }

        const agentAllowanceCurrency = agents[0].allowance.currency;

        const balanceResult = await getBalance({
          accountId: context.accountId,
          live: context.live,
          currency: agentAllowanceCurrency,
        });

        if (!balanceResult.ok) {
          console.error(balanceResult.error);
          return toolResponse({
            error: `Couldn't get balance, please try again later.`,
          });
        }

        const agent = withRemainingAllowance(
          agents[0],
          balanceResult.value?.amount ?? "0"
        );

        return toolResponse({
          structuredContent: {
            permissionToken: "i_have_read_permissions_RpMFWVAmFPOSvrByDEYgs",
            permissionExpirationMinutes: 5,
            rules: agent.rules,
            balances: [
              {
                currency: agentAllowanceCurrency,
                budgetLimit: agent.allowance.amount,
                remainingBudget: agent.remainingAllowance.amount,
                budgetResetsInDays:
                  agent.allowance.frequency === "daily"
                    ? 1
                    : agent.allowance.frequency === "weekly"
                    ? 7
                    : 30,
              },
            ],
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
