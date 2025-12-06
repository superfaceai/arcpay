import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { ConnectAgent } from "./ConnectAgent";
import {
  loadAccountById,
  listAgents,
  listApiKeysForAccount,
} from "@/identity/entities";

import { acpCheckoutsMcpUrl } from "@/acp-checkouts/mcp";
import { walletMcpUrl } from "@/wallet/mcp";

export const connectRoute = createWebRoute().get(
  "/connect",
  withWebAuth(),
  async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;
    const agentsList = await listAgents({ accountId });

    const agentId = c.req.query("agent");

    const agent = agentId ? agentsList.find(
      (agent) => agent.id === agentId
    ) : agentsList[0];

    if (!agent) {
      return c.redirect("/home");
    }

    const baseUrl = new URL(c.req.url).origin;

    const account = (await loadAccountById(accountId))!;
    const apiKeys = (await listApiKeysForAccount({ accountId })).filter(
      (apiKey) => apiKey.live === isLive
    );

    if (!apiKeys.length) {
      return c.redirect(`/agents/${agentId}`);
    }

    return c.html(
      <ConnectAgent
        account={account}
        agent={agent}
        isTestMode={!isLive}
        walletMcpUrl={walletMcpUrl(baseUrl)}
        acpMcpUrl={acpCheckoutsMcpUrl(baseUrl)}
        apiKey={apiKeys[0]}
      />
    );
  }
);
