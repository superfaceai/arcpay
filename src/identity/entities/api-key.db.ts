import { db } from "@/database";
import { ApiKey } from "@/identity/entities";

const storageKey = ({ id, accountId }: { id: string; accountId: string }) =>
  `apikey:${accountId}:${id}`;
const storageKeyBySecret = ({ key }: { key: string }) => `apikey:key:${key}`;

export const saveApiKey = async (apiKey: ApiKey) => {
  await db
    .multi()
    .hset(storageKey({ id: apiKey.id, accountId: apiKey.account }), apiKey)
    .hset(storageKeyBySecret({ key: apiKey.key }), apiKey)
    .exec();

  return apiKey;
};

export const loadApiKeyBySecret = async (
  key: string
): Promise<ApiKey | null> => {
  const apiKey = await db.hgetall<ApiKey>(storageKeyBySecret({ key }));

  if (!apiKey) {
    return null;
  }

  return ApiKey.parse(apiKey);
};

export const listApiKeysForAccount = async ({
  accountId,
}: {
  accountId: string;
}): Promise<ApiKey[]> => {
  let cursor = "0";
  const apiKeyStorageKeys: string[] = [];

  do {
    const [nextCursor, keys] = await db.scan(cursor, {
      match: storageKey({ accountId, id: "*" }),
      count: 100_000,
    });
    cursor = nextCursor;

    if (keys.length) {
      apiKeyStorageKeys.push(...keys);
    }
  } while (cursor !== "0");

  if (!apiKeyStorageKeys.length) return [];

  const apiKeys: ApiKey[] = [];

  for (const apiKeyStorageKey of apiKeyStorageKeys) {
    const apiKey = await db.hgetall<ApiKey>(apiKeyStorageKey);
    if (!apiKey) continue;

    apiKeys.push(ApiKey.parse(apiKey));
  }

  return apiKeys;
};

export const eraseApiKeysForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  let cursor = "0";
  const apiKeyStorageKeys: string[] = [];

  do {
    const [nextCursor, keys] = await db.scan(cursor, {
      match: storageKey({ accountId, id: "*" }),
      count: 100_000,
    });
    cursor = nextCursor;

    if (keys.length) {
      apiKeyStorageKeys.push(...keys);
    }
  } while (cursor !== "0");

  if (!apiKeyStorageKeys.length) return;

  for (const apiKeyStorageKey of apiKeyStorageKeys) {
    const apiKey = await db.hgetall<ApiKey>(apiKeyStorageKey);
    if (!apiKey) continue;

    await db.del(storageKeyBySecret({ key: apiKey.key }));
    await db.del(storageKey({ id: apiKey.id, accountId }));
    console.debug(`Removed API Key '${apiKey.id}' for Account '${accountId}'`);
  }

  console.debug(`Removed API Keys for Account '${accountId}'`);
};
