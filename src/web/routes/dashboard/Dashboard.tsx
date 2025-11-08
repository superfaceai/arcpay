import Big from "big.js";
import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account } from "@/identity/entities";
import { Balance, Location } from "@/balances/entities";
import { Payment, Transaction } from "@/payments/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";

type DashboardProps = {
  account: Account;
  balances: Balance[];
  totalUsdcBalance: string;
  locations: Location[];
  payments: Payment[];
  transactions: Transaction[];
};

export const Dashboard: FC<DashboardProps> = (props: DashboardProps) => {
  return (
    <Layout>
      <AppLayout>
        <AppNavigation account={props.account} />

        <div>
          <span className="muted">Total balance</span>
          <h1>{props.totalUsdcBalance} USDC</h1>

          <div className="primary-actions">
            <a href="/send" className="button primary small">Send</a>
            <a href="/deposit" className="button primary small">Deposit</a>
          </div>
        </div>

        <ul className="balances">
          {props.balances.map((balance) => (
            <li
              className="balance"
              key={balance.id}
              onClick={() => alert(balance.id)}
            >
              <span className="balance-currency">{balance.currency}</span>
              <span className="balance-amount">
                {Big(balance.amount).toFixed(2).toString()}
              </span>
            </li>
          ))}
        </ul>

        {/* <h2>Locations</h2>
        <ul>
          {props.locations.map((location) => (
            <li key={location.id}>
              {location.address} - {location.blockchain}
            </li>
          ))}
        </ul> */}

        <h2>Payments</h2>
        <ul>
          {props.payments.map((payment) => (
            <li key={payment.id}>
              {payment.amount} - {payment.currency}
            </li>
          ))}
        </ul>

        <h2>Transactions</h2>
        <ul>
          {props.transactions.map((transaction) => (
            <li key={transaction.id}>
              {transaction.amount} - {transaction.currency}
            </li>
          ))}
        </ul>
      </AppLayout>
    </Layout>
  );
};
