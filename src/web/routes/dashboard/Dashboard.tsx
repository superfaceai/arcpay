import Big from "big.js";
import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account } from "@/identity/entities";
import { Balance, Location } from "@/balances/entities";
import { Payment, Transaction } from "@/payments/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";
import { IconBanknoteUp, IconCoins } from "@/web/components/icons";
import { DAY } from "@/lib";

type DashboardProps = {
  account: Account;
  balances: Balance[];
  totalUsdcBalance: string;
  locations: Location[];
  payments: Payment[];
  transactions: Transaction[];
};

export const Dashboard: FC<DashboardProps> = (props: DashboardProps) => {
  const feeTransactions = props.transactions.filter(
    (transaction) => transaction.type === "fee"
  );

  const paymentTransactions = props.transactions.filter(
    (transaction) => transaction.type === "payment"
  );

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

        <div>
          <h2 className="space-between padding-content">
            <span>Transactions</span>

            <a href="#transactions" className="text-small">
              View all
            </a>
          </h2>

          <ul className="transactions">
            {paymentTransactions.map((transaction) => (
              <TransactionLine
                key={transaction.id}
                transaction={transaction}
                fee={feeTransactions.find(
                  (fee) => fee.blockchain.hash === transaction.blockchain.hash
                )}
                payment={props.payments.find(
                  (payment) => payment.id === transaction.payment
                )}
              />
            ))}
          </ul>
        </div>
      </AppLayout>
    </Layout>
  );
};

function TransactionLine({
  transaction,
  fee,
  payment,
}: {
  transaction: Transaction;
  fee?: Transaction;
  payment?: Payment;
}) {
  const amount = formatAmount(transaction.amount);

  const name = payment
    ? formatPaymentName(payment)
    : formatTransactionName(transaction);

  const status =
    transaction.status === "canceled"
      ? "Canceled"
      : transaction.status === "failed"
      ? "Failed"
      : "";

  const date = formatTxDate(new Date(transaction.created_at));

  const statusLine = [status, date].filter(Boolean).join(" • ");

  return (
    <li className="transaction" key={transaction.id}>
      <div className="transaction-left">
        <div className="transaction-icon">
          {payment ? <IconBanknoteUp /> : <IconCoins />}
        </div>

        <div className="transaction-details">
          <span className="transaction-type">{name}</span>
          <span className="transaction-status">{statusLine}</span>
        </div>
      </div>

      <div className="transaction-money">
        <span
          className={[
            "value",
            amount.type === "incoming" ? "incoming" : "",
          ].join(" ")}
        >
          {amount.value} {transaction.currency}
        </span>

        {fee && <span className="fee-short">+ fee</span>}

        {fee ? (
          <span className="fee">
            {fee.amount} {fee.currency}
          </span>
        ) : (
          <span className="fee">&nbsp;</span>
        )}
      </div>
    </li>
  );
}

const formatAmount = (
  amount: string
): { type: "incoming" | "outgoing"; value: string } => {
  const amountValue = Big(amount);

  if (amountValue.gt(0)) {
    return { type: "incoming", value: `+ ${amountValue.toString()}` };
  }
  return { type: "outgoing", value: `${amountValue.abs().toString()}` };
};

const formatPaymentName = (payment: Payment): string => {
  if (payment.method === "crypto") {
    return `To ${formatBlockchainAddress(payment.crypto?.address ?? "")}`;
  }

  return `To '${payment.arcpay?.account}'`;
};

const formatTransactionName = (transaction: Transaction): string => {
  const direction = transaction.amount.startsWith("-") ? "To" : "From";

  const counterparty =
    transaction.type === "payment"
      ? formatBlockchainAddress(transaction.blockchain.counterparty)
      : transaction.fee_type === "network"
      ? "Network Fee"
      : "Unknown";

  return [direction, counterparty].join(" ");
};

const formatBlockchainAddress = (address: string): string => {
  // convert full address to  0xE3...4a5E
  return (
    address.substring(0, 4) + "..." + address.substring(address.length - 4)
  );
};

const formatTxDate = (date: Date, now = new Date()): string => {
  const diff = now.getTime() - date.getTime();

  const timeFormat = new Intl.DateTimeFormat("en-US", {
    timeStyle: "short",
  }).format(new Date(date));

  if (diff < 2 * DAY) {
    const format = new Intl.DateTimeFormat("en-US", {
      dateStyle: "full",
    }).format(new Date(date));

    const dayOfWeek = format.split(", ")[0];

    return [dayOfWeek, timeFormat].join(", ");
  }

  const dateFormat = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));

  return [dateFormat, timeFormat].join(", ");
};
