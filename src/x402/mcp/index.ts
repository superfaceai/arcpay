import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";
import { withAuth } from "@/api/middlewares";

import { fetchWithPaymentTool } from "@/x402/mcp-tools";

export const x402McpUrl = (baseUrl: string) =>
  new URL("/x402", baseUrl).toString();

export const x402Mcp = createApi().all("/x402", withAuth(), async (c) => {
  const accountId = c.get("accountId");
  const live = c.get("isLive");
  const hostUrl = new URL(c.req.url).origin;

  const mcpServer = createMcpServer({
    name: "x402",
    title: "x402 Payments",
  });

  [fetchWithPaymentTool].forEach((tool) =>
    mcpServer.registerTool(
      tool.name,
      // @ts-ignore
      tool.config,
      tool.createCb({ accountId, live, hostUrl }),
    ),
  );

  return handleMcpRequest(mcpServer, c);
});
