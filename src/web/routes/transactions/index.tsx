import { DAY } from "@/lib";
import { createWebRoute, getSession } from "@/web/services";
import { withWebAuth } from "@/web/middleware";

import { loadAccountById } from "@/identity/entities";
import {
  getTransaction,
  listPayments,
  listTransactions,
} from "@/payments/services";

import { AllTransactions } from "./AllTransactions";
import { TransactionDetail } from "./TransactionDetail";
import { listLocations } from "@/balances/services";

export const transactionsRoute = createWebRoute()
  .get("/all-transactions", withWebAuth(), async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { accountId, isLive } = session.account;
    const account = (await loadAccountById(accountId))!;

    const dataFrom = new Date(Date.now() - 90 * DAY);

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
        isTestMode={!isLive}
      />
    );
  })
  .get("/txn/:transactionId", withWebAuth(), async (c) => {
    const session = await getSession(c);
    if (!session.account) {
      return c.redirect("/login");
    }

    const { transactionId } = c.req.param();
    if (!transactionId) {
      return c.redirect("/all-transactions");
    }

    const { accountId, isLive } = session.account;
    const account = (await loadAccountById(accountId))!;

    const transactionDetail = await getTransaction({
      accountId,
      transactionId,
      live: isLive,
    });
    if (!transactionDetail.ok) {
      return c.text(transactionDetail.error.message, 500);
    }

    const locations = await listLocations({ accountId, live: isLive });
    if (!locations.ok) {
      return c.text(locations.error.message, 500);
    }

    return c.html(
      <TransactionDetail
        account={account}
        transactions={transactionDetail.value?.transactions ?? []}
        locations={locations.value}
        payment={transactionDetail.value?.payment}
        capture={transactionDetail.value?.capture}
        isTestMode={!isLive}
      />
    );
  });
