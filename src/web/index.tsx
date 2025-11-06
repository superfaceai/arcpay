// import { listResources } from "@/api/services";
import { Home } from "@/components/Home";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";

export const web = new Hono();

web.use("/public/*", serveStatic({ root: "./src/web" }));
web.get("/", (c) => {
  const host = new URL(c.req.url);
  // const resources = listResources(web, ["/mcp/wallets"]); // TODO: resources must be from the main app

  return c.html(<Home host={host.toString()} resources={[]} />);
});
