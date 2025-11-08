import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { MyAccount } from "./MyAccount";
import { loadAccountById } from "@/identity/entities";

export const myAccountRoute = createWebRoute().get(
  "/my-account",
  withWebAuth(),
  async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;

    const account = (await loadAccountById(accountId))!;

    return c.html(<MyAccount account={account} />);
  }
);
