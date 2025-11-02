import { db } from "@/database";
import { Account } from "@/identity/entities";

const storageKey = (id: string) => `acct:${id}`;
const storageKeyByHandle = (handle: string) => `acct:handle:${handle}`;

export const saveAccount = async (account: Account) => {
  await db
    .multi()
    .hset(storageKey(account.id), account)
    .set(storageKeyByHandle(account.handle), account.id)
    .exec();
  return account;
};

export const loadAccountById = async (id: string) => {
  const account = await db.hgetall<Account>(storageKey(id));
  return account ? Account.parse(account) : null;
};

export const loadAccountByHandle = async (handle: string) => {
  const accountId = await db.get<string>(storageKeyByHandle(handle));
  if (!accountId) return null;
  return loadAccountById(accountId);
};

export const eraseAccount = async ({ accountId }: { accountId: string }) => {
  const account = await loadAccountById(accountId);
  if (!account) return;

  await db
    .multi()
    .del(storageKey(accountId))
    .del(storageKeyByHandle(account.handle))
    .exec();

  console.debug(`Removed Account '${accountId}'`);
};
