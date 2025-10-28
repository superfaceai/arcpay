import { db } from "@/database";
import { ApiKey } from "@/identity/entities";

const storageKeyById = ({ id }: { id: string }) => `apikey:id:${id}`;
const storageKeyBySecret = ({ key }: { key: string }) => `apikey:key:${key}`;
const storageKeyByAccount = ({ accountId }: { accountId: string }) =>
  `account:${accountId}:apikeys`;

export const saveApiKey = async (apiKey: ApiKey) => {
  await db
    .multi()
    .hset(storageKeyById({ id: apiKey.id }), apiKey)
    .hset(storageKeyBySecret({ key: apiKey.key }), apiKey)
    .zadd(storageKeyByAccount({ accountId: apiKey.account }), {
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

export const eraseApiKeysForAccount = async ({
  accountId,
}: {
  accountId: string;
}) => {
  const apiKeyIds = await db.zrange<string[]>(
    storageKeyByAccount({ accountId }),
    0,
    -1
  );
  if (!apiKeyIds) return;

  for (const apiKeyId of apiKeyIds) {
    const apiKey = await db.hgetall<ApiKey>(storageKeyById({ id: apiKeyId }));
    if (!apiKey) continue;

    await db.del(storageKeyBySecret({ key: apiKey.key }));
    await db.del(storageKeyById({ id: apiKeyId }));
    console.debug(`Removed API Key '${apiKeyId}' for Account '${accountId}'`);
  }
  await db.del(storageKeyByAccount({ accountId }));

  console.debug(`Removed API Keys for Account '${accountId}'`);
};
