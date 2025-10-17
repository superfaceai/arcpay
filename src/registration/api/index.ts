import { register, RegisterDTO, erase } from "@/registration/services/index.js";

import { createApi } from "@/api/services/index.js";
import { ProblemJson, ApiObject } from "@/api/values/index.js";
import { withValidation, withAuth } from "@/api/middlewares/index.js";

export const registrationApi = createApi()
  .post("/new", withValidation("json", RegisterDTO), async (c) => {
    const input = c.req.valid("json");

    const registration = await register(input);

    if (!registration.ok) {
      console.error(registration.error);
      return ProblemJson(
        c,
        500,
        "Internal Server Error",
        "Could not create wallet on the issuer's network. Please try again later."
      );
    }

    return c.json(ApiObject("apikey", registration.value));
  })
  .delete("/me", withAuth(), async (c) => {
    await erase({ userId: c.get("userId") });

    return new Response(null, { status: 204 });
  });
