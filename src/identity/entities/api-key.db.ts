import { db } from "@/database/index.js";
import { ApiKey } from "@/identity/entities/index.js";

const storageKeyById = ({ id }: { id: string }) => `apikey:id:${id}`;
const storageKeyBySecret = ({ key }: { key: string }) => `apikey:key:${key}`;
const storageKeyByUser = ({ userId }: { userId: string }) =>
  `user:${userId}:apikeys`;

export const saveApiKey = async (apiKey: ApiKey) => {
  await db
    .multi()
    .hset(storageKeyById({ id: apiKey.id }), apiKey)
    .hset(storageKeyBySecret({ key: apiKey.key }), apiKey)
    .zadd(storageKeyByUser({ userId: apiKey.user }), {
      score: apiKey.created_at.getTime(),
      member: apiKey.id,
    })
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

export const eraseApiKeysForUser = async ({ userId }: { userId: string }) => {
  const apiKeyIds = await db.zrange<string[]>(
    storageKeyByUser({ userId }),
    0,
    -1
  );
  if (!apiKeyIds) return;

  for (const apiKeyId of apiKeyIds) {
    const apiKey = await db.hgetall<ApiKey>(storageKeyById({ id: apiKeyId }));
    if (!apiKey) continue;

    await db.del(storageKeyBySecret({ key: apiKey.key }));
    await db.del(storageKeyById({ id: apiKeyId }));
    console.debug(`Removed API Key '${apiKeyId}' for User '${userId}'`);
  }
  await db.del(storageKeyByUser({ userId }));

  console.debug(`Removed API Keys for User '${userId}'`);
};
