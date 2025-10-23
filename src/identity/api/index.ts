import { createApi } from "@/api/services/index.js";
import { ProblemJson, ApiObject } from "@/api/values/index.js";
import { withAuth, withValidation } from "@/api/middlewares/index.js";

import { loadUserById } from "@/identity/entities/index.js";
import { signUp, SignUpDTO } from "@/identity/services/index.js";
import { getOrThrow } from "@/lib/index.js";

export const identityApi = createApi()
  .post("/new", withValidation("json", SignUpDTO), async (c) => {
    const input = c.req.valid("json");

    const apiKeyResult = await signUp(input);

    return c.json(ApiObject("apikey", getOrThrow(apiKeyResult)));
  })
  .get("/me", withAuth(), async (c) => {
    const user = await loadUserById(c.get("userId"));

    if (!user) return ProblemJson(c, 404, "Not Found");

    return c.json(ApiObject("user", user));
  });
