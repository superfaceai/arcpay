import { createWebRoute, isLoggedIn } from "@/web/services";

import { IndexPage } from "./IndexPage";

export const indexRoute = createWebRoute().get("/", async (c) => {
  const loggedIn = await isLoggedIn(c);

  return c.html(<IndexPage isLoggedIn={loggedIn} />);
});
