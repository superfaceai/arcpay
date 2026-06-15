import { listResources } from "@/api/services";
import { getRequestOrigin } from "@/lib";
import { createWebRoute, isLoggedIn } from "@/web/services";

import { ApiDocs } from "./ApiDocs";

export const apiDocsRoute = (resources: ReturnType<typeof listResources>) =>
  createWebRoute().get("/docs/api", async (c) => {
    const host = getRequestOrigin(c);
    const loggedIn = await isLoggedIn(c);
    return c.html(
      <ApiDocs host={host} resources={resources} isLoggedIn={loggedIn} />
    );
  });
