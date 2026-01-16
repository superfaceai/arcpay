import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";
import { withAuth } from "@/api/middlewares";

import {
  listAddressesTool,
  preauthorizePaymentTool,
  readPermissionsTool,
} from "@/wallet/mcp-tools";

export const walletMcpUrl = (baseUrl: string) =>
  new URL("/wallet", baseUrl).toString();

export const walletMcp = createApi().all("/wallet", withAuth(), async (c) => {
  const accountId = c.get("accountId");
  const live = c.get("isLive");
  const hostUrl = new URL(c.req.url).origin;

  const mcpServer = createMcpServer({
    name: "wallet",
    title: "Agentic Wallet",
  });

  [readPermissionsTool, listAddressesTool, preauthorizePaymentTool].forEach(
    (tool) =>
      mcpServer.registerTool(
        tool.name,
        // @ts-ignore
        tool.config,
        tool.createCb({ hostUrl, accountId, live })
      )
  );

  return handleMcpRequest(mcpServer, c);
});
