import { createMiddleware } from "hono/factory";

import { getSession } from "@/web/services";

export const withWebAuth = ({ redirectTo }: { redirectTo?: string } = {}) =>
  createMiddleware(async (c, next) => {
    const session = await getSession(c);

    if (!session.account) {
      if (redirectTo) {
        return c.redirect(redirectTo);
      }
      return c.redirect(`/login?redirect=${encodeURIComponent(c.req.url)}`);
    }

    c.set("accountId", session.account.accountId);
    c.set("isLive", session.account.isLive);

    await next();
  });
