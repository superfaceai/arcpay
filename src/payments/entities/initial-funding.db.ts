import { db } from "@/database";
import { InitialFunding } from "./initial-funding.entity";

const storageKey = ({
  accountId,
  id,
  live,
}: {
  accountId: string;
  id: string;
  live: boolean;
}) => `ifund:${accountId}:${live ? "live" : "test"}:${id}`;

export const saveInitialFunding = async (initialFunding: InitialFunding) => {
  await db.hset(
    storageKey({
      accountId: initialFunding.account,
      id: initialFunding.id,
      live: initialFunding.live,
    }),
    initialFunding
  );
};

export const loadInitialFunding = async ({
  accountId,
  id,
  live,
}: {
  accountId: string;
  id: string;
  live: boolean;
}): Promise<InitialFunding | null> => {
  const initialFunding = await db.hgetall<InitialFunding>(
    storageKey({ accountId, id, live })
  );

  if (!initialFunding) return null;

  return InitialFunding.parse(initialFunding);
};

export const eraseInitialFundingsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {

  const eraseInitialFundings = async ({ live }: { live: boolean }) => {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await db.scan(cursor, {
        match: storageKey({ accountId, live, id: "*" }),
        count: 100_000,
      });
      cursor = nextCursor;

      if (keys.length) {
        const delCount = await db.del(...keys);
        deletedCount += delCount;
      }
    } while (cursor !== "0");

    console.debug(
      `Removed ${deletedCount} Initial Fundings for Account '${accountId}' (Live: ${live})`
    );
  };

  await eraseInitialFundings({ live: true });
  await eraseInitialFundings({ live: false });
};
