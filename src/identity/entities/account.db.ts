import { db } from "@/database";
import { Account } from "@/identity/entities";

const storageKey = (id: string) => `acct:${id}`;

export const saveAccount = async (account: Account) => {
  await db.hset(storageKey(account.id), account);
  return account;
};

export const loadAccountById = async (id: string) => {
  const account = await db.hgetall<Account>(storageKey(id));
  return account ? Account.parse(account) : null;
};

export const eraseAccount = async ({ accountId }: { accountId: string }) => {
  const account = await loadAccountById(accountId);
  if (!account) return;

  await db.del(storageKey(accountId));
  console.debug(`Removed Account '${accountId}'`);
};
