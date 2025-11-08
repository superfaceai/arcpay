import Big from "big.js";
import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import {
  Account,
  Agent,
  AgentWithRemainingAllowance,
} from "@/identity/entities";
import { Balance, Location } from "@/balances/entities";
import { Payment, Transaction } from "@/payments/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";
import { TransactionsList } from "../transactions/components/TransactionsList";
import { IconZap } from "@/web/components/icons";

type HomeProps = {
  account: Account;
  balances: Balance[];
  totalUsdcBalance: string;
  locations: Location[];
  payments: Payment[];
  transactions: Transaction[];
  agents: AgentWithRemainingAllowance[];
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
            <a href="/request-deposit" className="button primary small">
              Deposit
            </a>
          </div>

          <ul className="balances">
            {props.balances.map((balance) => (
              <li className="balance" key={balance.id}>
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

        {props.agents.length > 0 && (
          <div className="agents-section">
            <h2>Agents</h2>

            <ul className="agents">
              {props.agents.map((agent) => (
                <li className="agent" key={agent.id}>
                  <a href={`/agents/${agent.id}`}>&nbsp;</a>

                  <div className="agent-title">
                    <div>
                      <IconZap />
                    </div>

                    {agent.name}
                  </div>

                  <span className="agent-amount">
                    {agent.remainingAllowance.amount} {agent.allowance.currency}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="transactions-section">
          <h2 class="space-between padding-content">
            Transactions
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
