import { db } from "@/database";

import { X402Response } from "./x402-response.entity";

const storageKeyByPaymentId = ({
  accountId,
  live,
  paymentId,
}: {
  accountId: string;
  live: boolean;
  paymentId: string;
}) => `x402resp:${accountId}:${live ? "live" : "test"}:${paymentId}`;

export const saveX402Response = async ({
  accountId,
  response,
}: {
  accountId: string;
  response: X402Response;
}) => {
  await db.hset(
    storageKeyByPaymentId({
      accountId,
      live: response.live,
      paymentId: response.payment_id,
    }),
    response,
  );

  return response;
};

export const loadX402ResponseByPaymentId = async ({
  accountId,
  live,
  paymentId,
}: {
  accountId: string;
  live: boolean;
  paymentId: string;
}): Promise<X402Response | null> => {
  const response = await db.hgetall<X402Response>(
    storageKeyByPaymentId({ accountId, live, paymentId }),
  );

  if (!response) {
    return null;
  }

  return X402Response.parse(response);
};

export const eraseX402ResponsesForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  let cursor = "0";
  let deletedCount = 0;

  do {
    const [nextCursor, keys] = await db.scan(cursor, {
      match: `x402resp:${accountId}:*`,
      count: 100_000,
    });
    cursor = nextCursor;

    if (keys.length) {
      const delCount = await db.del(...keys);
      deletedCount += delCount;
    }
  } while (cursor !== "0");

  console.debug(
    `Removed ${deletedCount} x402 Responses for Account '${accountId}'`,
  );
};
