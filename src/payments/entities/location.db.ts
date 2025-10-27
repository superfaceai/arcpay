import { db, Pipeline } from "@/database";
import { Location } from "@/payments/entities";

const storageKey = ({
  userId,
  live,
  id,
}: {
  userId: string;
  live: boolean;
  id: string;
}) => `user:${userId}:wallets:${live ? "live" : "test"}:${id}`;

export const saveLocation = async (location: Location) => {
  await db.hset(
    storageKey({
      userId: location.owner,
      live: location.live,
      id: location.id,
    }),
    location
  );
};

export const saveLocationViaPipeline = ({
  location,
  pipeline,
}: {
  location: Location;
  pipeline: Pipeline;
}) => {
  pipeline.hset(
    storageKey({
      userId: location.owner,
      live: location.live,
      id: location.id,
    }),
    location
  );

  return pipeline;
};

export const saveMultipleLocations = async (locations: Location[]) => {
  const pipeline = db.multi();

  for (const location of locations) {
    saveLocationViaPipeline({ location, pipeline });
  }

  await pipeline.exec();
};

export const loadLocationById = async ({
  locationId,
  userId,
  live,
}: {
  locationId: string;
  userId: string;
  live: boolean;
}): Promise<Location | null> => {
  const location = await db.hgetall<Location>(
    storageKey({ userId, live, id: locationId })
  );

  if (!location || location.live !== live || location.owner !== userId) {
    return null;
  }

  return Location.parse(location);
};

export const loadManyLocationsById = async ({
  locationIds,
  userId,
  live,
}: {
  locationIds: string[];
  userId: string;
  live: boolean;
}): Promise<Location[]> => {
  if (locationIds.length === 0) return [];

  return (
    await Promise.all(
      [...new Set(locationIds)].map(async (locationId) => {
        return loadLocationById({
          locationId,
          userId,
          live,
        });
      })
    )
  ).filter((wallet) => !!wallet);
};

export const loadLocationsByUser = async ({
  userId,
  live,
}: {
  userId: string;
  live: boolean;
}): Promise<Location[]> => {
  const pattern = storageKey({ userId, live, id: "*" });

  let cursor = "0";
  const allKeys: string[] = [];

  do {
    const [nextCursor, keys] = await db.scan(cursor, {
      match: pattern,
      count: 100_000,
    });
    if (Array.isArray(keys) && keys.length > 0) {
      allKeys.push(...keys);
    }
    cursor = nextCursor;
  } while (cursor !== "0");

  if (allKeys.length === 0) return [];

  const locationsPipeline = db.pipeline();
  for (const key of allKeys) {
    locationsPipeline.hgetall<Location>(key);
  }
  const locationsRaw = await locationsPipeline.exec<Location[]>();

  return locationsRaw
    .filter((location) => !!location)
    .map((location) => Location.parse(location));
};

export const eraseLocationsForUser = async ({ userId }: { userId: string }) => {
  // TODO: Transfer remaining funds somewhere?

  const eraseLocations = async ({ live }: { live: boolean }) => {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await db.scan(cursor, {
        match: storageKey({ userId, live, id: "*" }),
        count: 100_000,
      });
      cursor = nextCursor;

      if (keys.length) {
        const delCount = await db.del(...keys);
        deletedCount += delCount;
      }
    } while (cursor !== "0");

    console.debug(
      `Removed ${deletedCount} Locations for User '${userId}' (Live: ${live})`
    );
  };

  await eraseLocations({ live: true });
  await eraseLocations({ live: false });
};
