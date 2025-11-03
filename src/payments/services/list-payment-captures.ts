import { z } from "zod";

import { DateCodec, ok, Result } from "@/lib";
import {
  PaymentCapture,
  loadPaymentCapturesByAccount,
  saveManyPaymentCaptures,
} from "@/payments/entities";
import { listTransactions } from "./list-transactions";
import { syncPaymentCapturesWithTransactions } from "./sync-paymentcaptures-with-transactions";

export const ListPaymentCapturesDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const listPaymentCaptures = async ({
  dto,
  accountId,
  live,
}: {
  dto: z.infer<typeof ListPaymentCapturesDTO>;
  accountId: string;
  live: boolean;
}): Promise<Result<PaymentCapture[], any>> => {
  const dbPaymentCaptures = await loadPaymentCapturesByAccount({
    accountId,
    live,
    from: dto.from,
    to: dto.to,
  });

  if (dbPaymentCaptures.length === 0) return ok([]);

  const syncedPaymentCaptures: PaymentCapture[] = [];
  const changedPaymentCaptures: PaymentCapture[] = [];

  const allTransactions = await listTransactions({
    accountId,
    filter: dto,
    live,
  });

  if (!allTransactions.ok) return allTransactions;

  for (const paymentCapture of dbPaymentCaptures) {
    const captureRelatedTransactions = allTransactions.value.filter(
      (tx) => tx.capture === paymentCapture.id
    );

    const { paymentCapture: syncedPaymentCapture, changed } =
      syncPaymentCapturesWithTransactions({
        paymentCapture,
        transactions: captureRelatedTransactions,
      });

    syncedPaymentCaptures.push(syncedPaymentCapture);

    if (changed) {
      changedPaymentCaptures.push(syncedPaymentCapture);
    }
  }

  if (changedPaymentCaptures.length > 0) {
    await saveManyPaymentCaptures({
      paymentCaptures: changedPaymentCaptures,
      accountId,
    });
  }

  return ok(syncedPaymentCaptures);
};
