import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { loadAccountById } from "@/identity/entities";

const outputSchema = {
  addresses: z.array(
    z.object({
      id: z.string().describe("The ID of the address"),
      label: z.string().describe("The label of the address"),
      purposes: z
        .array(z.enum(["billing", "shipping"]))
        .describe("The purposes of the address"),
    })
  ),
};

export const listAddressesTool = createMcpTool(
  "list-addresses",
  {
    title: "List Addresses",
    description: "List the addresses for the current account",
    outputSchema,
  },
  (context) =>
    async ({}) => {
      try {
        const account = (await loadAccountById(context.accountId))!;

        return toolResponse({
          structuredContent: {
            addresses: account.addresses.map((address) => ({
              id: address.id,
              label: address.label,
              purposes: address.purposes,
            })),
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
