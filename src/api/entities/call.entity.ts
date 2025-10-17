import { z } from "zod";
import { generateId, DateCodec } from "@/lib/index.js";

export const generateIdempotencyKey = () => generateId("idm");

export const IdempotencyKey = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);
export type IdempotencyKey = z.infer<typeof IdempotencyKey>;

export const Call = z.object({
  idempotencyKey: IdempotencyKey,
  requestChecksum: z.string(),
  response: z.object({
    status: z.number(),
    headers: z.record(z.string(), z.string()),
    body: z.string(),
  }),
  created_at: DateCodec,
  expires_at: DateCodec,
});

export type Call = z.infer<typeof Call>;
