import Big from "big.js";

import {
  FeeTransaction,
  Payment,
  PaymentFee,
  PaymentTransaction,
  Transaction,
} from "@/payments/entities";

export const syncPaymentWithTransactions = ({
  payment,
  transactions,
}: {
  payment: Payment;
  transactions: Transaction[];
}): { payment: Payment; changed: boolean } => {
  if (transactions.length === 0) {
    return {
      payment,
      changed: false,
    };
  }

  let changed = false;
  let newPayment: Payment = { ...payment };
  const isX402Payment = payment.metadata?.protocol === "x402";

  const paymentTransaction = transactions.find(
    (transaction) => transaction.type === "payment"
  );
  if (paymentTransaction) {
    // only 1 payment transaction for now
    const paymentUpdate = mapPaymentTxToPaymentUpdate(paymentTransaction);
    newPayment = { ...newPayment, ...paymentUpdate };
    changed =
      paymentUpdate.status !== payment.status ||
      paymentUpdate.failure_reason !== payment.failure_reason ||
      paymentUpdate.finished_at !== payment.finished_at;
  }

  const feeTransaction = transactions.find(
    (transaction) => transaction.type === "fee"
  );
  if (feeTransaction && !isX402Payment) {
    // only 1 fee for now
    const fee = mapFeeTxToFee(feeTransaction);
    const feeExists = newPayment.fees.find(
      (f) =>
        f.type === fee.type &&
        f.currency === fee.currency &&
        f.amount === fee.amount
    );

    if (!feeExists && fee.amount !== "0") {
      newPayment = { ...newPayment, fees: [...newPayment.fees, fee] };
      changed = true;
    }
  }

  return {
    payment: newPayment,
    changed,
  };
};

const mapPaymentTxToPaymentUpdate = (
  paymentTx: PaymentTransaction
): Pick<Payment, "status" | "failure_reason" | "finished_at"> => {
  if (paymentTx.status === "failed") {
    return {
      status: "failed",
      failure_reason: paymentTx.failure_reason,
      finished_at: paymentTx.finished_at,
    };
  }
  if (paymentTx.status === "canceled") {
    return {
      status: "failed",
      failure_reason: paymentTx.cancellation_reason,
      finished_at: paymentTx.finished_at,
    };
  }
  if (paymentTx.status === "completed") {
    return {
      status: "succeeded",
      finished_at: paymentTx.finished_at,
    };
  }

  return {
    status: "pending",
  };
};

const mapFeeTxToFee = (feeTx: FeeTransaction): PaymentFee => {
  return {
    type: feeTx.fee_type,
    amount: Big(feeTx.amount).abs().toString(),
    currency: feeTx.currency,
  };
};
