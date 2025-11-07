import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";
import { withAuth } from "@/api/middlewares";

import { listAddressesTool, getBalanceTool } from "@/wallet/mcp-tools";

export const walletMcp = createApi().all("/wallet", withAuth(), async (c) => {
  const accountId = c.get("accountId");
  const live = c.get("isLive");

  const mcpServer = createMcpServer({
    name: "wallet",
    title: "Agentic Wallet",
  });

  [listAddressesTool, getBalanceTool].forEach((tool) =>
    mcpServer.registerTool(
      tool.name,
      // @ts-ignore
      tool.config,
      tool.createCb({ accountId, live })
    )
  );

  return handleMcpRequest(mcpServer, c);
});
