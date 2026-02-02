import { Redis } from "@upstash/redis";
import Config from "@/config";

const redis = new Redis({
  url: Config.KV_REST_API_URL,
  token: Config.KV_REST_API_TOKEN,
});

export const db = redis;
export { type Pipeline } from "@upstash/redis";
