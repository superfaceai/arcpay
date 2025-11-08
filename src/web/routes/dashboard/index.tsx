import { createWebRoute } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { Dashboard } from "./Dashboard";

export const dashboardRoute = createWebRoute().get(
  "/dashboard",
  withWebAuth(),
  async (c) => {
    return c.html(<Dashboard />);
  }
);
