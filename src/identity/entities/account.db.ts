import { db } from "@/database";
import { Account } from "@/identity/entities";

const storageKey = (id: string) => `acct:${id}`;
const storageKeyByHandle = (handle: string) => `acct:handle:${handle}`;
const storageKeyByPhone = (phone: string) =>
  `acct:phone:${phone.replace(/\D/g, "")}`;

export const saveAccount = async (account: Account) => {
  const phone = account.contacts?.find(
    (contact) => contact.method === "phone"
  )?.phone_number;

  const pipeline = db.multi();

  pipeline.hset(storageKey(account.id), account);
  pipeline.set(storageKeyByHandle(account.handle), account.id);
  if (phone) {
    pipeline.set(storageKeyByPhone(phone), account.id);
  }
  await pipeline.exec();

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

export const loadAccountByPhone = async (phone: string) => {
  const accountId = await db.get<string>(storageKeyByPhone(phone));
  if (!accountId) return null;
  return loadAccountById(accountId);
};

export const eraseAccount = async ({ accountId }: { accountId: string }) => {
  const account = await loadAccountById(accountId);
  if (!account) return;

  const phone = account.contacts.find(
    (contact) => contact.method === "phone"
  )?.phone_number;

  const pipeline = db.multi();

  pipeline.del(storageKey(accountId));
  pipeline.del(storageKeyByHandle(account.handle));
  if (phone) {
    pipeline.del(storageKeyByPhone(phone));
  }

  await pipeline.exec();

  console.debug(`Removed Account '${accountId}'`);
};
