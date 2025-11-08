import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account } from "@/identity/entities";
import { Payment, Transaction } from "@/payments/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";

import { TransactionsList } from "./components/TransactionsList";

type AllTransactionsProps = {
  account: Account;
  payments: Payment[];
  transactions: Transaction[];
};

export const AllTransactions: FC<AllTransactionsProps> = (
  props: AllTransactionsProps
) => {
  return (
    <Layout>
      <AppLayout>
        <AppNavigation account={props.account} backLink="/home" />

        <div className="transactions-section">
          <h2>
            <span>Transactions</span>

            {/* <a href="#transactions" className="text-small">
              View all
            </a> */}
          </h2>

          <TransactionsList
            payments={props.payments}
            transactions={props.transactions}
          />
        </div>
      </AppLayout>
    </Layout>
  );
};
