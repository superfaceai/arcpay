import Big from "big.js";
import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account } from "@/identity/entities";
import { Balance, Location } from "@/balances/entities";
import { Payment, Transaction } from "@/payments/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";
import { TransactionsList } from "../transactions/components/TransactionsList";

type HomeProps = {
  account: Account;
  balances: Balance[];
  totalUsdcBalance: string;
  locations: Location[];
  payments: Payment[];
  transactions: Transaction[];
};

export const Home: FC<HomeProps> = (props: HomeProps) => {
  return (
    <Layout>
      <AppLayout>
        <AppNavigation account={props.account} />

        <div className="balances-section padding-content">
          <div className="total">
            <span className="muted">Total balance</span>
            <h1>{props.totalUsdcBalance} USDC</h1>
          </div>

          <div className="primary-actions">
            <a href="#send" className="button primary small">
              Send
            </a>
            <a href="#deposit" className="button primary small">
              Deposit
            </a>
          </div>

          <ul className="balances">
            {props.balances.map((balance) => (
              <li
                className="balance"
                key={balance.id}
                onClick={() => alert(balance.id)}
              >
                <div className="balance-currency">
                  <div>&nbsp;</div>
                  {balance.currency}
                </div>
                <span className="balance-amount">
                  {Big(balance.amount).toFixed(2).toString()}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="transactions-section">
          <h2>
            <span>Transactions</span>

            <a href="/all-transactions" className="text-small">
              View all
            </a>
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
