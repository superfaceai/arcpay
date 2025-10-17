import { generateId, DateCodec } from "@/lib/index.js";
import { z } from "zod";

export const generateApiKey = (live: boolean) =>
  live ? generateId("sk_live_", 96) : generateId("sk_test", 96);

export const apiKeyId = () => generateId("api");

export const ApiKey = z.object({
  id: z.string(),
  key: z.string(),
  user: z.string(),
  live: z.boolean(),
  created_at: DateCodec,
});

export type ApiKey = z.infer<typeof ApiKey>;
