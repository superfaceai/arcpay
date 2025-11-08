import { createWebRoute } from "@/web/services";

import { IndexPage } from "./IndexPage";

export const indexRoute = createWebRoute().get("/", async (c) => {
  return c.html(<IndexPage />);
});
