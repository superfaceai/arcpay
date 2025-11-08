import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account } from "@/identity/entities";
import { Location } from "@/balances/entities";
import { Payment, PaymentCapture, Transaction } from "@/payments/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";

import { Transaction as TransactionComponent } from "./components/Transaction";

type TransactionDetailProps = {
  account: Account;
  transactions: Transaction[];
  locations: Location[];
  payment?: Payment;
  capture?: PaymentCapture;
};

export const TransactionDetail: FC<TransactionDetailProps> = (
  props: TransactionDetailProps
) => {
  return (
    <Layout>
      <AppLayout>
        <AppNavigation account={props.account} backLink="/home" />

        <div className="transactions-section">
          <TransactionComponent
            locations={props.locations}
            payment={props.payment}
            capture={props.capture}
            transactions={props.transactions}
          />
        </div>
      </AppLayout>
    </Layout>
  );
};
