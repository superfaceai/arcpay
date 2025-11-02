import { createApi } from "@/api/services";
import { ProblemJson, ApiObject } from "@/api/values";
import { withAuth, withValidation } from "@/api/middlewares";

import { loadAccountById } from "@/identity/entities";
import { signUp, SignUpDTO } from "@/identity/services";

export const identityApi = createApi()
  .post("/accounts", withValidation("json", SignUpDTO), async (c) => {
    const input = c.req.valid("json");

    const apiKeyResult = await signUp(input);

    if (!apiKeyResult.ok) {
      if (apiKeyResult.error.type === "AccountHandleNotAvailableError") {
        return ProblemJson(
          c,
          400,
          "Handle not available",
          `The handle '${apiKeyResult.error.handle}' is not available`
        );
      }

      throw new Error(apiKeyResult.error.type);
    }

    return c.json(ApiObject("apikey", apiKeyResult.value), { status: 201 });
  })
  .get("/account", withAuth(), async (c) => {
    const account = await loadAccountById(c.get("accountId"));

    if (!account) return ProblemJson(c, 404, "Not Found");

    return c.json(ApiObject("account", account));
  });
