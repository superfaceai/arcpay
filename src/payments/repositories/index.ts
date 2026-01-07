import { db } from "@/database";

import {
  BridgeTransfer,
  Payment,
  PaymentCapture,
  PaymentMandate,
  saveBridgeTransferViaPipeline,
  savePaymentCaptureViaPipeline,
  savePaymentMandateViaPipeline,
  savePaymentViaPipeline,
  saveTransactionViaPipeline,
  Transaction,
} from "@/payments/entities";

type DataByAccount = {
  accountId: string;
  mandates: PaymentMandate[];
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
    for (const mandate of account.mandates) {
      savePaymentMandateViaPipeline({
        paymentMandate: mandate,
        pipeline,
      });
    }
  }

  await pipeline.exec();
};

/**
 * Save a bridge transfer and its related transactions in a single DB transaction.
 */
export const saveBridgeTransferWithTransactions = async (
  accountId: string,
  bridge: BridgeTransfer,
  transactions: Transaction[]
) => {
  const pipeline = db.multi();

  saveBridgeTransferViaPipeline({
    bridgeTransfer: bridge,
    accountId,
    pipeline,
  });

  for (const transaction of transactions) {
    saveTransactionViaPipeline({
      transaction,
      accountId,
      pipeline,
    });
  }

  await pipeline.exec();
};
