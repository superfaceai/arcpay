import { db } from "@/database";
import { Call } from "./call.entity";

const storageKeyByIdempotencyKey = ({
  accountId,
  idempotencyKey,
}: {
  accountId: string;
  idempotencyKey: string;
}) => `idem:${accountId}:${idempotencyKey}`;

export const saveCall = async ({
  call,
  accountId,
}: {
  call: Call;
  accountId: string;
}) => {
  await db
    .multi()
    .hset(
      storageKeyByIdempotencyKey({
        accountId,
        idempotencyKey: call.idempotencyKey,
      }),
      call
    )

    .expireat(
      storageKeyByIdempotencyKey({
        accountId,
        idempotencyKey: call.idempotencyKey,
      }),
      Math.floor(call.expires_at.getTime() / 1000)
    )
    .exec();

  return call;
};

export const loadCallByIdempotencyKey = async ({
  accountId,
  idempotencyKey,
}: {
  accountId: string;
  idempotencyKey: string;
}): Promise<Call | null> => {
  const call = await db.hgetall<Call>(
    storageKeyByIdempotencyKey({ accountId, idempotencyKey })
  );

  if (!call) {
    return null;
  }

  return Call.parse(call);
};

export const eraseCallsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  let cursor = "0";
  let deletedCount = 0;

  do {
    // scan returns [nextCursor, keys[]]
    const [nextCursor, keys] = await db.scan(cursor, {
      match: storageKeyByIdempotencyKey({
        accountId,
        idempotencyKey: "*",
      }),
      count: 100_000,
    });
    cursor = nextCursor;

    if (keys.length) {
      const delCount = await db.del(...keys);
      deletedCount += delCount;
    }
  } while (cursor !== "0");

  console.debug(`Removed ${deletedCount} Calls for Account '${accountId}'`);
};
