import { Home } from "@/web/pages/Home";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { listResources } from "@/api/services";

export const web = (resources: ReturnType<typeof listResources>) => {
  return new Hono()
    .use("/public/*", serveStatic({ root: "./src/web" }))
    .get("/", (c) => {
      const host = new URL(c.req.url);
      return c.html(<Home host={host.toString()} resources={resources} />);
    });
};
