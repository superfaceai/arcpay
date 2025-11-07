import { createApi } from "@/api/services";
import { createMcpServer, handleMcpRequest } from "@/mcp/services";

import {
  listProductsTool,
  addToNewCartTool,
  updateCheckoutTool,
  cancelCheckoutTool,
  confirmOrderAndPayTool,
} from "@/acp-checkouts/mcp-tools";

export const acpCheckoutsMcp = createApi().all("/acp_checkouts", async (c) => {
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
    // @ts-ignore
    mcpServer.registerTool(tool.name, tool.config, tool.cb)
  );

  return handleMcpRequest(mcpServer, c);
});
