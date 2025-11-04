import { db, Pipeline } from "@/database";
import { PaymentMandate, paymentMandateSortDesc } from "@/payments/entities";

const storageKeyById = ({
  id,
  live,
  accountId,
}: {
  id: string;
  live: boolean;
  accountId: string;
}) => `mandate:${accountId}:${live ? "live" : "test"}:${id}`;
const storageKeyByAccount = ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => `mandates:${accountId}:${live ? "live" : "test"}`;
const storageKeyBySecret = ({
  live,
  secret,
}: {
  live: boolean;
  secret: string;
}) => `mandate:secret:${live ? "live" : "test"}:${secret}`;

type DataStoredBySecret = Pick<PaymentMandate, "id" | "live" | "on_behalf_of">;

export const savePaymentMandateViaPipeline = ({
  paymentMandate,
  pipeline,
}: {
  paymentMandate: PaymentMandate;
  pipeline: Pipeline;
}) => {
  pipeline
    .hset(
      storageKeyById({
        id: paymentMandate.id,
        live: paymentMandate.live,
        accountId: paymentMandate.on_behalf_of,
      }),
      paymentMandate
    )
    .zadd(
      storageKeyByAccount({
        accountId: paymentMandate.on_behalf_of,
        live: paymentMandate.live,
      }),
      {
        score: paymentMandate.created_at.getTime(),
        member: paymentMandate.id,
      }
    )
    .hset(
      storageKeyBySecret({
        live: paymentMandate.live,
        secret: paymentMandate.secret,
      }),
      <DataStoredBySecret>{
        id: paymentMandate.id,
        live: paymentMandate.live,
        on_behalf_of: paymentMandate.on_behalf_of,
      }
    );

  return pipeline;
};

export const savePaymentMandate = async ({
  paymentMandate,
}: {
  paymentMandate: PaymentMandate;
}) => {
  const pipeline = db.multi();
  savePaymentMandateViaPipeline({ paymentMandate, pipeline });
  await pipeline.exec();

  return paymentMandate;
};

export const saveManyPaymentMandates = async ({
  paymentMandates,
}: {
  paymentMandates: PaymentMandate[];
}) => {
  const pipeline = db.multi();

  for (const paymentMandate of paymentMandates) {
    savePaymentMandateViaPipeline({ paymentMandate, pipeline });
  }

  await pipeline.exec();
};

export const loadPaymentMandateById = async ({
  accountId,
  mandateId,
  live,
}: {
  accountId: string;
  mandateId: string;
  live: boolean;
}): Promise<PaymentMandate | null> => {
  const paymentMandate = await db.hgetall<PaymentMandate>(
    storageKeyById({ id: mandateId, live, accountId })
  );

  if (!paymentMandate) {
    return null;
  }

  return PaymentMandate.parse(paymentMandate);
};

export const loadPaymentMandateBySecret = async ({
  secret,
  live,
}: {
  secret: string;
  live: boolean;
}): Promise<PaymentMandate | null> => {
  const paymentMandateInfo = await db.hgetall<DataStoredBySecret>(
    storageKeyBySecret({ secret, live })
  );

  if (!paymentMandateInfo) {
    return null;
  }

  return await loadPaymentMandateById({
    accountId: paymentMandateInfo.on_behalf_of,
    mandateId: paymentMandateInfo.id,
    live,
  });
};

export const loadPaymentMandatesByAccount = async ({
  accountId,
  live,
  from,
  to,
}: {
  accountId: string;
  live: boolean;
  from?: Date;
  to?: Date;
}): Promise<PaymentMandate[]> => {
  const paymentMandateIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId, live }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const paymentMandates = await Promise.all(
    paymentMandateIds.map((paymentMandateId) =>
      loadPaymentMandateById({ accountId, mandateId: paymentMandateId, live })
    )
  );

  return paymentMandates
    .filter((paymentMandate) => paymentMandate !== null)
    .sort(paymentMandateSortDesc);
};

export const erasePaymentMandatesForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const erasePaymentMandates = async ({ live }: { live: boolean }) => {
    const paymentMandateIds = await db.zrange<string[]>(
      storageKeyByAccount({ accountId, live }),
      0,
      -1
    );

    const pipeline = db.pipeline();

    for (const paymentMandateId of paymentMandateIds) {
      const paymentMandate = await db.hgetall<PaymentMandate>(
        storageKeyById({ id: paymentMandateId, live, accountId })
      );
      if (!paymentMandate) continue;

      pipeline.del(storageKeyById({ id: paymentMandateId, live, accountId }));
      pipeline.del(storageKeyBySecret({ live, secret: paymentMandate.secret }));
      console.debug(
        `Removing Payment Mandate '${paymentMandateId}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await erasePaymentMandates({ live: true });
  await erasePaymentMandates({ live: false });

  console.debug(`Removed Payment Mandates for Account '${accountId}'`);
};
