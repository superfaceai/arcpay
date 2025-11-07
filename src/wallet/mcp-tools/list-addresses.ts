import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

const outputSchema = {
  addresses: z.array(
    z.object({
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
        console.info("Listing addresses", { accountId: context.accountId });

        return toolResponse({
          structuredContent: {
            addresses: [],
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
