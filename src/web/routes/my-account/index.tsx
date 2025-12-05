import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { listApiKeysForAccount, loadAccountById } from "@/identity/entities";
import { MyAccount } from "./MyAccount";
import { ApiKeysList } from "./ApiKeysList";

export const myAccountRoute = createWebRoute()
  .get("/my-account", withWebAuth(), async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;

    const account = (await loadAccountById(accountId))!;

    return c.html(<MyAccount account={account} isTestMode={!isLive} />);
  })
  .get("/my-account/api-keys", withWebAuth(), async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;

    const account = (await loadAccountById(accountId))!;

    const apiKeys = await listApiKeysForAccount({ accountId });

    return c.html(
      <ApiKeysList account={account} apiKeys={apiKeys} isTestMode={!isLive} />
    );
  });
