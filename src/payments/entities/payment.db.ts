import { db, Pipeline } from "@/database";
import {
  Payment,
  paymentSortDesc,
  saveTransactionViaPipeline,
  Transaction,
} from "@/payments/entities";

const storageKeyById = ({
  id,
  live,
  accountId,
}: {
  id: string;
  live: boolean;
  accountId: string;
}) => `pay:${accountId}:${live ? "live" : "test"}:${id}`;
const storageKeyByAccount = ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => `pays:${accountId}:${live ? "live" : "test"}`;

export const savePayment = async ({
  payment,
  accountId,
}: {
  payment: Payment;
  accountId: string;
}) => {
  await db
    .multi()
    .hset(
      storageKeyById({ id: payment.id, live: payment.live, accountId }),
      payment
    )
    .zadd(storageKeyByAccount({ accountId, live: payment.live }), {
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
  pipeline.hset(
    storageKeyById({ id: payment.id, live: payment.live, accountId }),
    payment
  );
  pipeline.zadd(storageKeyByAccount({ accountId, live: payment.live }), {
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
  accountId,
  paymentId,
  live,
}: {
  accountId: string;
  paymentId: string;
  live: boolean;
}): Promise<Payment | null> => {
  const payment = await db.hgetall<Payment>(
    storageKeyById({ id: paymentId, live, accountId })
  );

  if (!payment) {
    return null;
  }

  return Payment.parse(payment);
};

export const loadPaymentsByAccount = async ({
  accountId,
  live,
  from,
  to,
}: {
  accountId: string;
  live: boolean;
  from?: Date;
  to?: Date;
}): Promise<Payment[]> => {
  const paymentIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId, live }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const payments = await Promise.all(
    paymentIds.map((paymentId) =>
      loadPaymentById({ accountId, paymentId, live })
    )
  );

  return payments.filter((payment) => payment !== null).sort(paymentSortDesc);
};

export const erasePaymentsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const erasePayments = async ({ live }: { live: boolean }) => {
    const paymentIds = await db.zrange<string[]>(
      storageKeyByAccount({ accountId, live }),
      0,
      -1
    );

    const pipeline = db.pipeline();

    for (const paymentId of paymentIds) {
      pipeline.del(storageKeyById({ id: paymentId, live, accountId }));
      console.debug(
        `Removing Payment '${paymentId}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await erasePayments({ live: true });
  await erasePayments({ live: false });

  console.debug(`Removed Payments for Account '${accountId}'`);
};
