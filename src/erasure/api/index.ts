import { erase } from "@/erasure/services/index.js";

import { createApi } from "@/api/services/index.js";
import { withAuth } from "@/api/middlewares/index.js";

export const erasureApi = createApi().delete("/me", withAuth(), async (c) => {
  await erase({ userId: c.get("userId") });

  return c.newResponse(null, 204);
});
