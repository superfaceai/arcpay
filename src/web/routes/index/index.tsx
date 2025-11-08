import { listResources } from "@/api/services";
import { createWebRoute } from "@/web/services";

import { Home } from "./Home";

export const indexRoute = (resources: ReturnType<typeof listResources>) =>
  createWebRoute().get("/", async (c) => {
    const host = new URL(c.req.url);
    return c.html(<Home host={host.origin} resources={resources} />);
  });
