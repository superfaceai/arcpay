import { listResources } from "@/api/services";
import { createWebRoute } from "@/web/services";

import { ApiDocs } from "./ApiDocs";

export const apiDocsRoute = (resources: ReturnType<typeof listResources>) =>
  createWebRoute().get("/docs/api", async (c) => {
    const host = new URL(c.req.url);
    return c.html(<ApiDocs host={host.origin} resources={resources} />);
  });
