import { z, ZodRawShape } from "zod-v3";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const createMcpTool = <
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape
>(
  name: string,
  config: {
    title?: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema?: OutputArgs;
  },
  createCb: (context: {
    accountId: string;
    live: boolean;
  }) => (input: z.infer<z.ZodObject<InputArgs>>) => Promise<CallToolResult>
) => {
  return {
    name,
    config,
    createCb,
  };
};
