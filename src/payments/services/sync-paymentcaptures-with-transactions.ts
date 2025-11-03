import {
  PaymentCapture,
  PaymentTransaction,
  Transaction,
} from "@/payments/entities";

export const syncPaymentCapturesWithTransactions = ({
  paymentCapture,
  transactions,
}: {
  paymentCapture: PaymentCapture;
  transactions: Transaction[];
}): { paymentCapture: PaymentCapture; changed: boolean } => {
  if (transactions.length === 0) {
    return {
      paymentCapture,
      changed: false,
    };
  }

  let changed = false;
  let newPaymentCapture: PaymentCapture = { ...paymentCapture };

  const paymentTransaction = transactions.find(
    (transaction) => transaction.type === "payment"
  );
  if (paymentTransaction) {
    // only 1 payment transaction for now
    const paymentUpdate = mapPaymentTxToCaptureUpdate(paymentTransaction);
    newPaymentCapture = { ...newPaymentCapture, ...paymentUpdate };
    changed =
      paymentUpdate.status !== paymentCapture.status ||
      paymentUpdate.failure_reason !== paymentCapture.failure_reason ||
      paymentUpdate.failed_at !== paymentCapture.failed_at ||
      paymentUpdate.finished_at !== paymentCapture.finished_at;
  }

  return {
    paymentCapture: newPaymentCapture,
    changed,
  };
};

const mapPaymentTxToCaptureUpdate = (
  paymentTx: PaymentTransaction
): Pick<
  PaymentCapture,
  "status" | "failure_reason" | "failed_at" | "finished_at"
> => {
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
    status: "processing",
  };
};
