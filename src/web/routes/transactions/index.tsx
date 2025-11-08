import { DAY } from "@/lib";
import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { AllTransactions } from "./AllTransactions";
import { loadAccountById } from "@/identity/entities";
import { listPayments, listTransactions } from "@/payments/services";

const dataFrom = new Date(Date.now() - 30 * DAY);

export const transactionsRoute = createWebRoute().get(
  "/all-transactions",
  withWebAuth(),
  async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;
    const account = (await loadAccountById(accountId))!;

    const transactions = await listTransactions({
      accountId,
      live: isLive,
      filter: { from: dataFrom },
    });
    if (!transactions.ok) {
      return c.text(transactions.error.message, 500);
    }

    const payments = await listPayments({
      accountId,
      live: isLive,
      dto: { from: dataFrom },
    });

    if (!payments.ok) {
      return c.text(payments.error.message, 500);
    }

    return c.html(
      <AllTransactions
        account={account}
        payments={payments.value}
        transactions={transactions.value}
      />
    );
  }
);
