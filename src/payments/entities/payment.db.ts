import { db, Pipeline } from "@/database";
import {
  Payment,
  paymentSortDesc,
  saveTransactionViaPipeline,
  Transaction,
} from "@/payments/entities";

const storageKeyById = ({ id }: { id: string }) => `pay:${id}`;
const storageKeyByAccount = ({ accountId }: { accountId: string }) =>
  `acct:${accountId}:payments`;

export const savePayment = async ({
  payment,
  accountId,
}: {
  payment: Payment;
  accountId: string;
}) => {
  await db
    .multi()
    .hset(storageKeyById({ id: payment.id }), payment)
    .zadd(storageKeyByAccount({ accountId }), {
      score: payment.created_at.getTime(),
      member: payment.id,
    })
    .exec();

  return payment;
};
export const savePaymentViaPipeline = async ({
  payment,
  accountId,
  pipeline,
}: {
  payment: Payment;
  accountId: string;
  pipeline: Pipeline;
}) => {
  pipeline.hset(storageKeyById({ id: payment.id }), payment);
  pipeline.zadd(storageKeyByAccount({ accountId }), {
    score: payment.created_at.getTime(),
    member: payment.id,
  });

  return pipeline;
};

export const saveManyPayments = async ({
  payments,
  accountId,
}: {
  payments: Payment[];
  accountId: string;
}) => {
  const pipeline = db.multi();

  for (const payment of payments) {
    savePaymentViaPipeline({ payment, accountId, pipeline });
  }

  await pipeline.exec();
};

export const savePaymentWithTransactions = async ({
  payment,
  transactions,
  accountId,
}: {
  payment: Payment;
  transactions: Transaction[];
  accountId: string;
}) => {
  const pipeline = db.multi();

  savePaymentViaPipeline({ payment, accountId, pipeline });
  for (const transaction of transactions) {
    saveTransactionViaPipeline({ transaction, accountId, pipeline });
  }

  await pipeline.exec();

  return payment;
};

export const loadPaymentById = async ({
  paymentId,
}: {
  paymentId: string;
}): Promise<Payment | null> => {
  const payment = await db.hgetall<Payment>(storageKeyById({ id: paymentId }));

  if (!payment) {
    return null;
  }

  return Payment.parse(payment);
};
export const loadPaymentsByAccount = async ({
  accountId,
  from,
  to,
}: {
  accountId: string;
  from?: Date;
  to?: Date;
}): Promise<Payment[]> => {
  const paymentIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const payments = await Promise.all(
    paymentIds.map((paymentId) => loadPaymentById({ paymentId }))
  );

  return payments.filter((payment) => payment !== null).sort(paymentSortDesc);
};

export const erasePaymentsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const paymentIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId }),
    0,
    -1
  );

  const pipeline = db.pipeline();

  for (const paymentId of paymentIds) {
    pipeline.del(storageKeyById({ id: paymentId }));
    console.debug(`Removing Payment '${paymentId}' for Account '${accountId}'`);
  }
  pipeline.del(storageKeyByAccount({ accountId }));

  await pipeline.exec();

  console.debug(`Removed Payments for Account '${accountId}'`);
};
