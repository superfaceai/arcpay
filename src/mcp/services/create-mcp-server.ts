import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const createMcpServer = ({
  name,
  title,
  version = "0.0.1",
}: {
  name: string;
  title?: string;
  version?: string;
}) => {
  return new McpServer({
    name,
    title,
    version,
  });
};
