import { createApi } from "@/api/services";
import { withAuth } from "@/api/middlewares";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";

import {
  listProductsTool,
  addToNewCartTool,
  updateCheckoutTool,
  cancelCheckoutTool,
  confirmOrderAndPayTool,
} from "@/ucp-checkouts/mcp-tools";

export const ucpCheckoutsMcpUrl = (baseUrl: string) =>
  new URL("/ucp_checkouts", baseUrl).toString();

export const ucpCheckoutsMcp = createApi().all(
  "/ucp_checkouts",
  withAuth(),
  async (c) => {
    const accountId = c.get("accountId");
    const live = c.get("isLive");
    const hostUrl = new URL(c.req.url).origin;

    const mcpServer = createMcpServer({
      name: "ucp-checkouts",
      title: "UCP Checkouts",
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
        tool.createCb({ hostUrl, accountId, live })
      )
    );

    return handleMcpRequest(mcpServer, c);
  }
);
