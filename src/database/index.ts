import { Redis } from "@upstash/redis";
import Config from "@/config";

const redis = new Redis({
  url: Config.REDIS_REST_URL,
  token: Config.REDIS_REST_TOKEN,
});

export const db = redis;
