import Big from "big.js";

import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { Agent } from "./Agent";

import {
  withRemainingAllowance,
  AgentWithRemainingAllowance,
  loadAccountById,
  listAgents,
} from "@/identity/entities";
import { listBalances } from "@/balances/services";

export const agentsRoute = createWebRoute().get(
  "/agents/:agentId",
  withWebAuth(),
  async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;
    const agentId = c.req.param("agentId");

    const agentDefinitions = await listAgents({ accountId });
    const agentDefinition = agentDefinitions.find(
      (agent) => agent.id === agentId
    );
    if (!agentDefinition) {
      return c.redirect("/home");
    }

    const account = (await loadAccountById(accountId))!;

    const balances = await listBalances({ accountId, live: isLive });

    if (!balances.ok) {
      return c.text(balances.error.message, 500);
    }

    const totalUsdcBalance = balances.value
      .reduce((acc, balance) => {
        if (balance.currency === "USDC") {
          return acc.plus(balance.amount);
        }
        return acc;
      }, Big(0))
      .toFixed(2)
      .toString();

    const agent: AgentWithRemainingAllowance = withRemainingAllowance(
      agentDefinition,
      totalUsdcBalance
    );

    return c.html(
      <Agent account={account} agent={agent} isTestMode={!isLive} />
    );
  }
);
