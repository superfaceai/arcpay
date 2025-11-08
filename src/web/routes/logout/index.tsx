import {
  createWebRoute,
  getSessionAndRemoveError,
  updateSession,
} from "@/web/services";

import { Logout } from "./Logout";
import { withWebAuth } from "@/web/middleware";

export const logoutRoute = createWebRoute()
  .get("/logout", withWebAuth({ redirectTo: "/login" }), async (c) => {
    const { error } = await getSessionAndRemoveError(c);

    return c.html(<Logout error={error} />);
  })
  .post("/logout", async (c) => {
    await updateSession(c, {
      account: null,
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    return c.redirect("/");
  });
