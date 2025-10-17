import { customAlphabet } from "nanoid";

const nanoid = customAlphabet(
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
);

export const generateId = (prefix: string, length: number = 21) =>
  [prefix, nanoid(length)].join("_");
