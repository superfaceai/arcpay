import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { bearerAuth } from "hono/bearer-auth";

import { loadApiKeyBySecret } from "@/identity/entities";

export const withAuth = () => bearerAuth({ verifyToken });

const verifyToken = async (token: string, c: Context) => {
  const apiKey = await loadApiKeyBySecret(token);
  if (!apiKey) {
    throw new HTTPException(401, {
      message: "Unauthorized",
    });
  }

  c.set("userId", apiKey.user);
  c.set("isLive", apiKey.live);
  return true;
};
