import { z } from "zod";

import { DateCodec, ok, Result } from "@/lib";
import {
  Payment,
  loadPaymentsByAccount,
  saveManyPayments,
} from "@/payments/entities";
import { BlockchainActionError } from "@/payments/errors";

import { syncPaymentWithTransactions } from "./sync-payment-with-transactions";
import { listTransactions } from "./list-transactions";

export const ListPaymentsDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const listPayments = async ({
  dto,
  accountId,
  live,
}: {
  dto: z.infer<typeof ListPaymentsDTO>;
  accountId: string;
  live: boolean;
}): Promise<Result<Payment[], BlockchainActionError>> => {
  const dbPayments = await loadPaymentsByAccount({
    accountId,
    from: dto.from,
    to: dto.to,
  });

  if (dbPayments.length === 0) return ok([]);

  const syncedPayments: Payment[] = [];
  const changedPayments: Payment[] = [];

  const allTransactions = await listTransactions({
    accountId,
    filter: dto,
    live,
  });

  if (!allTransactions.ok) return allTransactions;

  for (const payment of dbPayments) {
    const paymentRelatedTransactions = allTransactions.value.filter(
      (tx) => tx.payment === payment.id
    );

    const { payment: syncedPayment, changed } = syncPaymentWithTransactions({
      payment,
      transactions: paymentRelatedTransactions,
    });

    syncedPayments.push(syncedPayment);

    if (changed) {
      changedPayments.push(syncedPayment);
    }
  }

  if (changedPayments.length > 0) {
    await saveManyPayments({ payments: changedPayments, accountId });
  }

  return ok(syncedPayments);
};
