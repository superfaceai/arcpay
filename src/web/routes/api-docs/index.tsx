import { listResources } from "@/api/services";
import { createWebRoute, isLoggedIn } from "@/web/services";

import { ApiDocs } from "./ApiDocs";

export const apiDocsRoute = (resources: ReturnType<typeof listResources>) =>
  createWebRoute().get("/docs/api", async (c) => {
    const host = new URL(c.req.url);
    const loggedIn = await isLoggedIn(c);
    return c.html(
      <ApiDocs host={host.origin} resources={resources} isLoggedIn={loggedIn} />
    );
  });
