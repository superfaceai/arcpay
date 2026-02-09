import { db, Pipeline } from "@/database";
import { Location } from "@/balances/entities";

const storageKey = ({
  accountId,
  live,
  id,
}: {
  accountId: string;
  live: boolean;
  id: string;
}) => `loc:${accountId}:${live ? "live" : "test"}:${id}`;

const storageKeyByAddress = ({
  live,
  blockchain,
  address,
}: {
  live: boolean;
  blockchain: string;
  address: string;
}) =>
  `loc:address:${live ? "live" : "test"}:${blockchain}:${address.toLowerCase()}`;

export const saveLocation = async (location: Location) => {
  const locationKey = storageKey({
    accountId: location.owner,
    live: location.live,
    id: location.id,
  });

  const pipeline = db.multi();
  pipeline.hset(locationKey, location);
  pipeline.set(
    storageKeyByAddress({
      live: location.live,
      blockchain: location.blockchain,
      address: location.address,
    }),
    locationKey
  );
  await pipeline.exec();
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
      accountId: location.owner,
      live: location.live,
      id: location.id,
    }),
    location
  );
  pipeline.set(
    storageKeyByAddress({
      live: location.live,
      blockchain: location.blockchain,
      address: location.address,
    }),
    storageKey({
      accountId: location.owner,
      live: location.live,
      id: location.id,
    })
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
  accountId,
  live,
}: {
  locationId: string;
  accountId: string;
  live: boolean;
}): Promise<Location | null> => {
  const location = await db.hgetall<Location>(
    storageKey({ accountId, live, id: locationId })
  );

  if (!location || location.live !== live || location.owner !== accountId) {
    return null;
  }

  return Location.parse(location);
};

export const loadManyLocationsById = async ({
  locationIds,
  accountId,
  live,
}: {
  locationIds: string[];
  accountId: string;
  live: boolean;
}): Promise<Location[]> => {
  if (locationIds.length === 0) return [];

  return (
    await Promise.all(
      [...new Set(locationIds)].map(async (locationId) => {
        return loadLocationById({
          locationId,
          accountId,
          live,
        });
      })
    )
  ).filter((wallet) => !!wallet);
};

export const loadLocationsByAccount = async ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}): Promise<Location[]> => {
  const pattern = storageKey({ accountId, live, id: "*" });

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

export const loadLocationByAddress = async ({
  address,
  blockchain,
  live,
}: {
  address: string;
  blockchain: string;
  live: boolean;
}): Promise<Location | null> => {
  const locationKey = await db.get<string>(
    storageKeyByAddress({
      live,
      blockchain,
      address,
    })
  );

  if (!locationKey) return null;

  const location = await db.hgetall<Location>(locationKey);
  if (!location) return null;

  const parsedLocation = Location.parse(location);
  if (
    parsedLocation.live !== live ||
    parsedLocation.blockchain !== blockchain ||
    parsedLocation.address.toLowerCase() !== address.toLowerCase()
  ) {
    return null;
  }

  return parsedLocation;
};

export const eraseLocationsForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  // TODO: Transfer remaining funds somewhere?

  const eraseLocations = async ({ live }: { live: boolean }) => {
    let cursor = "0";
    let deletedCount = 0;

    do {
      const [nextCursor, keys] = await db.scan(cursor, {
        match: storageKey({ accountId, live, id: "*" }),
        count: 100_000,
      });
      cursor = nextCursor;

      if (keys.length) {
        const locationsPipeline = db.pipeline();
        for (const key of keys) {
          locationsPipeline.hgetall<Location>(key);
        }
        const locationsRaw = await locationsPipeline.exec<Location[]>();

        const addressIndexKeys = locationsRaw
          .filter((location) => !!location)
          .map((location) =>
            storageKeyByAddress({
              live,
              blockchain: location.blockchain,
              address: location.address,
            })
          );

        const delCount = await db.del(...keys);
        if (addressIndexKeys.length > 0) {
          await db.del(...addressIndexKeys);
        }
        deletedCount += delCount;
      }
    } while (cursor !== "0");

    console.debug(
      `Removed ${deletedCount} Locations for Account '${accountId}' (Live: ${live})`
    );
  };

  await eraseLocations({ live: true });
  await eraseLocations({ live: false });
};
