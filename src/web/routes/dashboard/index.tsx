import Big from "big.js";

import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { Dashboard } from "./Dashboard";
import { loadAccountById } from "@/identity/entities";
import { listBalances, listLocations } from "@/balances/services";
import { listPayments, listTransactions } from "@/payments/services";
import { sortBalancesDesc } from "@/balances/entities";

const minute = 60 * 1000;
const hour = 60 * minute;
const day = 24 * hour;

export const dashboardRoute = createWebRoute().get(
  "/dashboard",
  withWebAuth(),
  async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;

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

    const locations = await listLocations({ accountId, live: isLive });

    if (!locations.ok) {
      return c.text(locations.error.message, 500);
    }

    const transactions = await listTransactions({
      accountId,
      live: isLive,
      filter: { from: new Date(Date.now() - 7 * day), to: new Date() },
    });
    if (!transactions.ok) {
      return c.text(transactions.error.message, 500);
    }

    const payments = await listPayments({
      accountId,
      live: isLive,
      dto: { from: new Date(Date.now() - 7 * day), to: new Date() },
    });

    if (!payments.ok) {
      return c.text(payments.error.message, 500);
    }

    const sortedBalances = balances.value.sort(sortBalancesDesc);

    return c.html(
      <Dashboard
        account={account}
        balances={sortedBalances}
        totalUsdcBalance={totalUsdcBalance}
        locations={locations.value}
        payments={payments.value}
        transactions={transactions.value}
      />
    );
  }
);
