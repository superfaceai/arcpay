import { Blockchain } from "@/balances/values";
import { Payment, Transaction, TransactionStatus } from "@/payments/entities";
import Big from "big.js";

export const formatAmount = (
  amount: string
): { type: "incoming" | "outgoing"; value: string } => {
  const amountValue = Big(amount);

  if (amountValue.gt(0)) {
    return { type: "incoming", value: `+ ${amountValue.toString()}` };
  }
  return { type: "outgoing", value: `${amountValue.abs().toString()}` };
};

export const formatName = ({
  transaction,
  payment,
}: {
  transaction: Transaction;
  payment?: Payment;
}) => {
  return payment
    ? formatPaymentName(payment)
    : formatTransactionName(transaction);
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

export const formatBlockchainAddress = (
  address: string,
  longer = false
): string => {
  if (longer) {
    return (
      address.substring(0, 6) + "..." + address.substring(address.length - 5)
    );
  }
  return (
    address.substring(0, 4) + "..." + address.substring(address.length - 4)
  );
};

export const formatBlockchainName = (blockchain: Blockchain): string => {
  return blockchain === "arc" ? "Arc" : blockchain;
};

export const formatTransactionStatus = (status: TransactionStatus): string => {
  if (status === "queued") return "Queued";
  if (status === "sent") return "Sent";
  if (status === "confirmed") return "Confirmed";
  if (status === "completed") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "canceled") return "Canceled";

  return status;
};
