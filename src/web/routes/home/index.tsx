import Big from "big.js";

import { DAY } from "@/lib";
import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { Home } from "./Home";
import {
  withRemainingAllowance,
  AgentWithRemainingAllowance,
  loadAccountById,
  listAgents,
} from "@/identity/entities";
import { listBalances, listLocations } from "@/balances/services";
import { listPayments, listTransactions } from "@/payments/services";
import { sortBalancesDesc } from "@/balances/entities";

export const homeRoute = createWebRoute().get(
  "/home",
  withWebAuth(),
  async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;

    const account = (await loadAccountById(accountId))!;

    const dataFrom = new Date(Date.now() - 7 * DAY);

    const [balances, locations, transactions, payments] = await Promise.all([
      listBalances({ accountId, live: isLive }),
      listLocations({ accountId, live: isLive }),
      listTransactions({
        accountId,
        live: isLive,
        filter: { from: dataFrom },
      }),
      listPayments({
        accountId,
        live: isLive,
        dto: { from: dataFrom },
      }),
    ]);

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

    if (!locations.ok) {
      return c.text(locations.error.message, 500);
    }

    if (!transactions.ok) {
      return c.text(transactions.error.message, 500);
    }

    if (!payments.ok) {
      return c.text(payments.error.message, 500);
    }

    const sortedBalances = balances.value.sort(sortBalancesDesc);

    const agentDefinitions = await listAgents({ accountId });

    const agents: AgentWithRemainingAllowance[] = agentDefinitions.map(
      (agent) => withRemainingAllowance(agent, totalUsdcBalance)
    );

    return c.html(
      <Home
        account={account}
        balances={sortedBalances}
        totalUsdcBalance={totalUsdcBalance}
        locations={locations.value}
        payments={payments.value}
        transactions={transactions.value}
        agents={agents}
      />
    );
  }
);
