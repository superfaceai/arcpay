import { db, Pipeline } from "@/database";
import {
  Payment,
  paymentSortDesc,
  saveTransactionViaPipeline,
  Transaction,
} from "@/payments/entities";

const storageKeyById = ({ id }: { id: string }) => `pay:${id}`;
const storageKeyByUser = ({ userId }: { userId: string }) =>
  `user:${userId}:payments`;

export const savePayment = async ({
  payment,
  userId,
}: {
  payment: Payment;
  userId: string;
}) => {
  await db
    .multi()
    .hset(storageKeyById({ id: payment.id }), payment)
    .zadd(storageKeyByUser({ userId }), {
      score: payment.created_at.getTime(),
      member: payment.id,
    })
    .exec();

  return payment;
};
export const savePaymentViaPipeline = async ({
  payment,
  userId,
  pipeline,
}: {
  payment: Payment;
  userId: string;
  pipeline: Pipeline;
}) => {
  pipeline.hset(storageKeyById({ id: payment.id }), payment);
  pipeline.zadd(storageKeyByUser({ userId }), {
    score: payment.created_at.getTime(),
    member: payment.id,
  });

  return pipeline;
};

export const saveManyPayments = async ({
  payments,
  userId,
}: {
  payments: Payment[];
  userId: string;
}) => {
  const pipeline = db.multi();

  for (const payment of payments) {
    savePaymentViaPipeline({ payment, userId, pipeline });
  }

  await pipeline.exec();
};

export const savePaymentWithTransactions = async ({
  payment,
  transactions,
  userId,
}: {
  payment: Payment;
  transactions: Transaction[];
  userId: string;
}) => {
  const pipeline = db.multi();

  savePaymentViaPipeline({ payment, userId, pipeline });
  for (const transaction of transactions) {
    saveTransactionViaPipeline({ transaction, userId, pipeline });
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
export const loadPaymentsByUser = async ({
  userId,
  from,
  to,
}: {
  userId: string;
  from?: Date;
  to?: Date;
}): Promise<Payment[]> => {
  const paymentIds = await db.zrange<string[]>(
    storageKeyByUser({ userId }),
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

export const erasePaymentsForUser = async ({ userId }: { userId: string }) => {
  const paymentIds = await db.zrange<string[]>(
    storageKeyByUser({ userId }),
    0,
    -1
  );

  const pipeline = db.pipeline();

  for (const paymentId of paymentIds) {
    pipeline.del(storageKeyById({ id: paymentId }));
    console.debug(`Removing Payment '${paymentId}' for User '${userId}'`);
  }
  pipeline.del(storageKeyByUser({ userId }));

  await pipeline.exec();

  console.debug(`Removed Payments for User '${userId}'`);
};
