import {
  createWebRoute,
  getSession,
  updateSession,
} from "@/web/services";

import { Logout } from "./Logout";
import { withWebAuth } from "@/web/middleware";
import { erase } from "@/erasure/services";

export const logoutRoute = createWebRoute()
  .get("/logout", withWebAuth({ redirectTo: "/login" }), async (c) => {
    const session = await getSession(c);
    const remove = c.req.query("remove");

    return c.html(
      <Logout
        removeOnly={remove === "true"}
        isTestMode={!session.account?.isLive}
      />
    );
  })
  .post("/logout", async (c) => {
    const session = await getSession(c);

    const remove = c.req.query("remove");

    if (remove === "true" && session.account) {
      await erase({ accountId: session.account.accountId });
    }

    await updateSession(c, {
      account: null,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    return c.redirect("/");
  });
