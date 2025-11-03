import { ok, Result } from "@/lib";
import {
  PaymentCapture,
  loadPaymentCaptureById,
  savePaymentCapture,
} from "@/payments/entities";
import { listTransactions } from "./list-transactions";
import { syncPaymentCapturesWithTransactions } from "./sync-paymentcaptures-with-transactions";

export const getPaymentCapture = async ({
  accountId,
  captureId,
  live,
}: {
  accountId: string;
  captureId: string;
  live: boolean;
}): Promise<Result<PaymentCapture | null, any>> => {
  const dbPaymentCapture = await loadPaymentCaptureById({
    accountId,
    live,
    paymentCaptureId: captureId,
  });

  if (!dbPaymentCapture) return ok(null);

  const allTransactions = await listTransactions({
    accountId,
    filter: {
      from: new Date(dbPaymentCapture.created_at.getTime() - 10_000),
      to: new Date(dbPaymentCapture.created_at.getTime() + 10_000),
    },
    live,
  });

  if (!allTransactions.ok) return allTransactions;

  const captureRelatedTransactions = allTransactions.value.filter(
    (tx) => tx.capture === dbPaymentCapture.id
  );

  const { paymentCapture: syncedPaymentCapture, changed } =
    syncPaymentCapturesWithTransactions({
      paymentCapture: dbPaymentCapture,
      transactions: captureRelatedTransactions,
    });

  if (changed) {
    await savePaymentCapture({
      paymentCapture: syncedPaymentCapture,
      accountId,
    });
  }

  return ok(syncedPaymentCapture);
};
