import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";

import {
  listProductsTool,
  addToCartTool,
  cancelCartTool,
  checkoutTool,
} from "@/acp-client/mcp-tools";

export const acpClientMcp = createApi().all("/acp-client", async (c) => {
  const mcpServer = createMcpServer({
    name: "acp-checkout",
    title: "ACP Checkout Client",
  });

  [listProductsTool, addToCartTool, checkoutTool, cancelCartTool].forEach(
    (tool) =>
      // @ts-ignore
      mcpServer.registerTool(tool.name, tool.config, tool.cb)
  );

  return handleMcpRequest(mcpServer, c);
});
