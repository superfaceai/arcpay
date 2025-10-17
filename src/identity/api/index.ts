import { createApi } from "@/api/services/index.js";
import { ProblemJson, ApiObject } from "@/api/values/index.js";
import { withAuth } from "@/api/middlewares/index.js";

import { loadUserById } from "@/identity/entities/index.js";

export const identityApi = createApi().get("/me", withAuth(), async (c) => {
  const user = await loadUserById(c.get("userId"));

  if (!user) return ProblemJson(c, 404, "Not Found");

  return c.json(ApiObject("user", user));
});
