import { createApi } from "@/api/services";
import { ProblemJson, ApiObject } from "@/api/values";
import { withAuth, withValidation } from "@/api/middlewares";

import { loadUserById } from "@/identity/entities";
import { signUp, SignUpDTO } from "@/identity/services";
import { getOrThrow } from "@/lib";

export const identityApi = createApi()
  .post("/accounts", withValidation("json", SignUpDTO), async (c) => {
    const input = c.req.valid("json");

    const apiKeyResult = await signUp(input);

    return c.json(ApiObject("apikey", getOrThrow(apiKeyResult)));
  })
  .get("/account", withAuth(), async (c) => {
    const user = await loadUserById(c.get("userId"));

    if (!user) return ProblemJson(c, 404, "Not Found");

    return c.json(ApiObject("user", user));
  });
