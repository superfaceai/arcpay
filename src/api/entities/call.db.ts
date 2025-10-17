import { db } from "@/database/index.js";
import { Call } from "./call.entity";

const storageKeyByIdempotencyKey = ({
  userId,
  idempotencyKey,
}: {
  userId: string;
  idempotencyKey: string;
}) => `idem:${userId}:${idempotencyKey}`;

export const saveCall = async ({
  call,
  userId,
}: {
  call: Call;
  userId: string;
}) => {
  await db
    .multi()
    .hset(
      storageKeyByIdempotencyKey({
        userId,
        idempotencyKey: call.idempotencyKey,
      }),
      call
    )

    .expireat(
      storageKeyByIdempotencyKey({
        userId,
        idempotencyKey: call.idempotencyKey,
      }),
      Math.floor(call.expires_at.getTime() / 1000)
    )
    .exec();

  return call;
};

export const loadCallByIdempotencyKey = async ({
  userId,
  idempotencyKey,
}: {
  userId: string;
  idempotencyKey: string;
}): Promise<Call | null> => {
  const call = await db.hgetall<Call>(
    storageKeyByIdempotencyKey({ userId, idempotencyKey })
  );

  if (!call) {
    return null;
  }

  return Call.parse(call);
};

export const eraseCallsForUser = async ({ userId }: { userId: string }) => {
  let cursor = "0";
  let deletedCount = 0;

  do {
    // scan returns [nextCursor, keys[]]
    const [nextCursor, keys] = await db.scan(cursor, {
      match: storageKeyByIdempotencyKey({
        userId,
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

  console.debug(`Removed ${deletedCount} Calls for User '${userId}'`);
};
