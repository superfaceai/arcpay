import { erase } from "@/erasure/services";

import { createApi } from "@/api/services";
import { withAuth } from "@/api/middlewares";

export const erasureApi = createApi().delete("/me", withAuth(), async (c) => {
  await erase({ userId: c.get("userId") });

  return c.newResponse(null, 204);
});
