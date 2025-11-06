import { listResources } from "@/api/services";
import { Home } from "@/components/Home";
import { Hono } from "hono";

export const web = new Hono();

web.get("/", (c) => {
  const host = new URL(c.req.url);
  // const resources = listResources(web, ["/mcp/wallets"]); // TODO: resources must be from the main app

  return c.html(<Home host={host.toString()} resources={[]} />);
});
