import { createApi } from "@/api/services";
import { ProblemJson, ApiObject } from "@/api/values";
import { withAuth } from "@/api/middlewares";

import { loadUserById } from "@/identity/entities";

export const identityApi = createApi().get("/me", withAuth(), async (c) => {
  const user = await loadUserById(c.get("userId"));

  if (!user) return ProblemJson(c, 404, "Not Found");

  return c.json(ApiObject("user", user));
});
