import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { listBalances } from "@/balances/services";

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
        const balancesResult = await listBalances({
          accountId: context.accountId,
          live: context.live,
        });

        if (!balancesResult.ok) {
          console.error(balancesResult.error);
          return toolResponse({
            error: `Couldn't get balance, please try again later.`,
          });
        }

        return toolResponse({
          structuredContent: {
            permissionToken: "i_have_read_permissions_RpMFWVAmFPOSvrByDEYgs",
            permissionExpirationMinutes: 5,
            rules: ["buy supplies for office", "buy food for office"],
            balances: balancesResult.value.map((balance) => ({
              currency: balance.currency,
              budgetLimit: "50",
              remainingBudget: balance.amount,
              budgetResetsInDays: 4,
            })),
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
