import { db } from "@/database/index.js";
import { User } from "@/identity/entities/index.js";

const storageKey = (id: string) => `user:${id}`;

export const saveUser = async (user: User) => {
  await db.hset(storageKey(user.id), user);
  return user;
};

export const loadUserById = async (id: string) => {
  const user = await db.hgetall<User>(storageKey(id));
  return user ? User.parse(user) : null;
};

export const eraseUser = async ({ userId }: { userId: string }) => {
  const user = await loadUserById(userId);
  if (!user) return;

  await db.del(storageKey(userId));
  console.debug(`Removed User '${userId}'`);
};
