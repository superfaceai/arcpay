import { ok, Result } from "@/lib";
import { PaymentCapture, loadPaymentCaptureById } from "@/payments/entities";

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

  // TODO: Sync with transactions

  return ok(dbPaymentCapture);
};
