import { ok, Result } from "@/lib";
import {
  loadTransactionById,
  Payment,
  PaymentCapture,
  Transaction,
} from "@/payments/entities";
import { BlockchainPaymentActionError } from "@/payments/errors";

import { listTransactions } from "./list-transactions";
import { listPayments } from "./list-payments";
import { listPaymentCaptures } from "./list-payment-captures";

export type GetTransactionResult = {
  transactions: Transaction[];
  payment?: Payment;
  capture?: PaymentCapture;
};

export const getTransaction = async (params: {
  accountId: string;
  transactionId: string;
  live: boolean;
}): Promise<
  Result<GetTransactionResult | null, BlockchainPaymentActionError>
> => {
  const tx = await loadTransactionById({
    accountId: params.accountId,
    transactionId: params.transactionId,
    live: params.live,
  });

  if (!tx) return ok(null);

  const relatedFrom = new Date(tx.created_at.getTime() - 10_000);
  const relatedTo = new Date(tx.created_at.getTime() + 10_000);

  const allTransactions = await listTransactions({
    accountId: params.accountId,
    filter: {
      from: relatedFrom,
      to: relatedTo,
    },
    live: params.live,
  });

  if (!allTransactions.ok) return allTransactions;

  const baseTx = allTransactions.value.find((tx) => tx.id === tx.id);
  if (!baseTx) return ok(null);

  const transactions = allTransactions.value.filter(
    (tx) => tx.blockchain.hash === baseTx.blockchain.hash
  );

  let payment: Payment | undefined = undefined;
  let capture: PaymentCapture | undefined = undefined;

  const relatedPaymentId = transactions.find((tx) => !!tx.payment)?.payment;
  const relatedCaptureId = transactions.find((tx) => !!tx.capture)?.capture;

  if (relatedPaymentId) {
    const payments = await listPayments({
      accountId: params.accountId,
      live: params.live,
      dto: {
        from: relatedFrom,
        to: relatedTo,
      },
    });
    if (!payments.ok) return payments;
    payment = payments.value.find((p) => p.id === relatedPaymentId);
  }

  if (relatedCaptureId) {
    const captures = await listPaymentCaptures({
      accountId: params.accountId,
      live: params.live,
      dto: {
        from: relatedFrom,
        to: relatedTo,
      },
    });
    if (!captures.ok) return captures;
    capture = captures.value.find((c) => c.id === relatedCaptureId);
  }

  return ok({ transactions, payment, capture });
};
