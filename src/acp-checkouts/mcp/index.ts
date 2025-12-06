import { createApi } from "@/api/services";
import { withAuth } from "@/api/middlewares";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";

import {
  listProductsTool,
  addToNewCartTool,
  updateCheckoutTool,
  cancelCheckoutTool,
  confirmOrderAndPayTool,
} from "@/acp-checkouts/mcp-tools";

export const acpCheckoutsMcpUrl = (baseUrl: string) =>
  new URL("/acp_checkouts", baseUrl).toString();

export const acpCheckoutsMcp = createApi().all(
  "/acp_checkouts",
  withAuth(),
  async (c) => {
    const accountId = c.get("accountId");
    const live = c.get("isLive");

    const mcpServer = createMcpServer({
      name: "acp-checkouts",
      title: "ACP Checkouts",
    });

    [
      listProductsTool,
      addToNewCartTool,
      updateCheckoutTool,
      confirmOrderAndPayTool,
      cancelCheckoutTool,
    ].forEach((tool) =>
      mcpServer.registerTool(
        tool.name,
        // @ts-ignore
        tool.config,
        tool.createCb({ accountId, live })
      )
    );

    return handleMcpRequest(mcpServer, c);
  }
);
