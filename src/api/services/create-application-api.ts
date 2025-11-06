import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";

import Config from "@/config";
import { ProblemJson } from "@/api/values";
import { withRequestId } from "@/api/middlewares";

import { createApi } from "./create-api.js";

export const createApplicationApi = <A extends ReturnType<typeof createApi>>(
  registerApis: (app: A) => void
) => {
  const app = createApi();

  if (!Config.IS_PRODUCTION) {
    app.use(logger());
  }
  app.use("*", withRequestId());

  registerApis(app as A);

  // Catch-all route for all unmatched paths
  app.all("*", async (c, next) => {
    if (!c.req.header("accept")?.includes("application/json")) {
      return await next();
    }

    return ProblemJson(
      c,
      404,
      "Not Found",
      "The requested resource was not found."
    );
  });

  app.onError(async (err, c) => {
    // Map Hono HTTPException to Problem JSON
    if (err instanceof HTTPException) {
      const res = err.getResponse();
      const title: string | undefined = await (async () => {
        try {
          const text = await res.text();
          return text;
        } catch {
          return undefined;
        }
      })();

      return ProblemJson(c, res.status, title ?? "Unknown error");
    }

    console.error(err);

    // Map unexpected errors to Problem JSON
    return ProblemJson(
      c,
      500,
      "Internal Server Error",
      "Something went wrong on our side"
    );
  });

  return app;
};
