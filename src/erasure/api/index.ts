import { erase } from "@/erasure/services";

import { createApi } from "@/api/services";
import { withAuth } from "@/api/middlewares";

export const erasureApi = createApi().delete(
  "/account",
  withAuth(),
  async (c) => {
    await erase({ accountId: c.get("accountId") });

    return c.newResponse(null, 204);
  }
);
