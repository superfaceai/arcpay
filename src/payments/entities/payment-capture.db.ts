import { db, Pipeline } from "@/database";
import {
  PaymentCapture,
  paymentCaptureSortDesc,
} from "./payment-capture.entity";

const storageKeyById = ({
  id,
  live,
  accountId,
}: {
  id: string;
  live: boolean;
  accountId: string;
}) => `payc:${accountId}:${live ? "live" : "test"}:${id}`;
const storageKeyByAccount = ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => `paycs:${accountId}:${live ? "live" : "test"}`;

export const savePaymentCaptureViaPipeline = ({
  paymentCapture,
  accountId,
  pipeline,
}: {
  paymentCapture: PaymentCapture;
  accountId: string;
  pipeline: Pipeline;
}) => {
  pipeline.hset(
    storageKeyById({
      id: paymentCapture.id,
      live: paymentCapture.live,
      accountId,
    }),
    paymentCapture
  );
  pipeline.zadd(storageKeyByAccount({ accountId, live: paymentCapture.live }), {
    score: paymentCapture.created_at.getTime(),
    member: paymentCapture.id,
  });

  return pipeline;
};

export const savePaymentCapture = async ({
  paymentCapture,
  accountId,
}: {
  paymentCapture: PaymentCapture;
  accountId: string;
}) => {
  const pipeline = db.multi();
  savePaymentCaptureViaPipeline({ paymentCapture, accountId, pipeline });
  await pipeline.exec();
  return paymentCapture;
};

export const saveManyPaymentCaptures = async ({
  paymentCaptures,
  accountId,
}: {
  paymentCaptures: PaymentCapture[];
  accountId: string;
}) => {
  const pipeline = db.multi();

  for (const paymentCapture of paymentCaptures) {
    savePaymentCaptureViaPipeline({ paymentCapture, accountId, pipeline });
  }

  await pipeline.exec();
};

export const loadPaymentCaptureById = async ({
  accountId,
  paymentCaptureId,
  live,
}: {
  accountId: string;
  paymentCaptureId: string;
  live: boolean;
}): Promise<PaymentCapture | null> => {
  const paymentCapture = await db.hgetall<PaymentCapture>(
    storageKeyById({ id: paymentCaptureId, live, accountId })
  );

  if (!paymentCapture) {
    return null;
  }

  return PaymentCapture.parse(paymentCapture);
};

export const loadPaymentCapturesByAccount = async ({
  accountId,
  live,
  from,
  to,
}: {
  accountId: string;
  live: boolean;
  from?: Date;
  to?: Date;
}): Promise<PaymentCapture[]> => {
  const paymentCaptureIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId, live }),
    from?.getTime() ?? 0,
    to?.getTime() ?? Number.MAX_SAFE_INTEGER,
    {
      byScore: true,
    }
  );

  const paymentCaptures = await Promise.all(
    paymentCaptureIds.map((paymentCaptureId) =>
      loadPaymentCaptureById({ accountId, paymentCaptureId, live })
    )
  );

  return paymentCaptures
    .filter((paymentCapture) => paymentCapture !== null)
    .sort(paymentCaptureSortDesc);
};

export const erasePaymentCapturesForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const erasePaymentCaptures = async ({ live }: { live: boolean }) => {
    const paymentCaptureIds = await db.zrange<string[]>(
      storageKeyByAccount({ accountId, live }),
      0,
      -1
    );

    const pipeline = db.pipeline();

    for (const paymentCaptureId of paymentCaptureIds) {
      pipeline.del(storageKeyById({ id: paymentCaptureId, live, accountId }));
      console.debug(
        `Removing Payment Capture '${paymentCaptureId}' for Account '${accountId}' (Live: ${live})`
      );
    }
    pipeline.del(storageKeyByAccount({ accountId, live }));

    await pipeline.exec();
  };

  await erasePaymentCaptures({ live: true });
  await erasePaymentCaptures({ live: false });

  console.debug(`Removed Payment Captures for Account '${accountId}'`);
};
