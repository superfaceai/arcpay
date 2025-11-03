import { db } from "@/database";

import {
  Payment,
  PaymentCapture,
  savePaymentCaptureViaPipeline,
  savePaymentViaPipeline,
  saveTransactionViaPipeline,
  Transaction,
} from "@/payments/entities";

type DataByAccount = {
  accountId: string;
  payments: Payment[];
  transactions: Transaction[];
  paymentCaptures: PaymentCapture[];
};

/**
 * Save payments, transactions and payment captures
 * for multiple accounts in a single transaction.
 */
export const savePaymentsWithTransactionsAndCaptures = async (
  dataByAccount: DataByAccount[]
) => {
  const pipeline = db.multi();

  for (const account of dataByAccount) {
    for (const payment of account.payments) {
      savePaymentViaPipeline({
        payment,
        accountId: account.accountId,
        pipeline,
      });
    }
    for (const transaction of account.transactions) {
      saveTransactionViaPipeline({
        transaction,
        accountId: account.accountId,
        pipeline,
      });
    }
    for (const paymentCapture of account.paymentCaptures) {
      savePaymentCaptureViaPipeline({
        paymentCapture,
        accountId: account.accountId,
        pipeline,
      });
    }
  }

  await pipeline.exec();
};
