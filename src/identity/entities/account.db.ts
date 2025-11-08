import { db } from "@/database";
import { Account } from "@/identity/entities";

const storageKey = (id: string) => `acct:${id}`;
const storageKeyByHandle = (handle: string) => `acct:handle:${handle}`;
const storageKeyByPhone = (phone: string) =>
  `acct:phone:${phone.replace(/\D/g, "")}`;
const storageKeyByEmail = (email: string) => `acct:email:${email.trim()}`;

export const saveAccount = async (account: Account) => {
  const phone = account.contacts?.find(
    (contact) => contact.method === "phone"
  )?.phone_number;

  const email = account.contacts?.find(
    (contact) => contact.method === "email"
  )?.email;

  const pipeline = db.multi();

  pipeline.hset(storageKey(account.id), account);
  pipeline.set(storageKeyByHandle(account.handle), account.id);
  if (phone) {
    pipeline.set(storageKeyByPhone(phone), account.id);
  }
  if (email) {
    pipeline.set(storageKeyByEmail(email), account.id);
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

export const loadAccountByEmail = async (email: string) => {
  const accountId = await db.get<string>(storageKeyByEmail(email));
  if (!accountId) return null;
  return loadAccountById(accountId);
};

export const eraseAccount = async ({ accountId }: { accountId: string }) => {
  const account = await loadAccountById(accountId);
  if (!account) return;

  const phone = account.contacts.find(
    (contact) => contact.method === "phone"
  )?.phone_number;

  const email = account.contacts.find(
    (contact) => contact.method === "email"
  )?.email;

  const pipeline = db.multi();

  pipeline.del(storageKey(accountId));
  pipeline.del(storageKeyByHandle(account.handle));
  if (phone) {
    pipeline.del(storageKeyByPhone(phone));
  }
  if (email) {
    pipeline.del(storageKeyByEmail(email));
  }

  await pipeline.exec();

  console.debug(`Removed Account '${accountId}'`);
};
