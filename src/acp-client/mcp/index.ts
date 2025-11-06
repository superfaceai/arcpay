import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";

import {
  listProductsTool,
  addToNewCartTool,
  updateCheckoutTool,
  cancelCheckoutTool,
  confirmOrderAndPayTool,
} from "@/acp-client/mcp-tools";

export const acpClientMcp = createApi().all("/acp-client", async (c) => {
  const mcpServer = createMcpServer({
    name: "acp-checkout",
    title: "ACP Checkout Client",
  });

  [
    listProductsTool,
    addToNewCartTool,
    updateCheckoutTool,
    confirmOrderAndPayTool,
    cancelCheckoutTool,
  ].forEach((tool) =>
    // @ts-ignore
    mcpServer.registerTool(tool.name, tool.config, tool.cb)
  );

  return handleMcpRequest(mcpServer, c);
});
