import { FC, Child } from "hono/jsx";

import { Payment, Transaction } from "@/payments/entities";
import { DAY } from "@/lib";

import { TransactionIcon } from "./TransactionIcon";
import { formatAmount, formatName } from "./formatting";

type TransactionsListProps = {
  payments: Payment[];
  transactions: Transaction[];
  emptyContent?: Child;
};

export const TransactionsList: FC<TransactionsListProps> = (
  props: TransactionsListProps
) => {
  const feeTransactions = props.transactions.filter(
    (transaction) => transaction.type === "fee"
  );

  const paymentTransactions = props.transactions.filter(
    (transaction) => transaction.type === "payment"
  );

  if (paymentTransactions.length === 0) {
    return (
      <div className="transactions-empty">
        {props.emptyContent || "No transactions in current period"}
      </div>
    );
  }

  return (
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
  const name = formatName({ transaction, payment });

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
      <a href={`/txn/${transaction.id}`}>&nbsp;</a>

      <div className="transaction-left">
        <TransactionIcon type={payment ? "payment" : "raw"} />

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
