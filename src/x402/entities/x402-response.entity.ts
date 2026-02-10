import { DateCodec } from "@/lib";
import { z } from "zod";

export const X402Response = z.object({
  payment_id: z.string(),
  live: z.boolean(),
  status: z.number().int(),
  headers: z.record(z.string(), z.string()),
  content_type: z.string().optional(),
  body_preview: z.string(),
  body_truncated: z.boolean(),
  body_was_json: z.boolean(),
  saved_at: DateCodec,
});

export type X402Response = z.infer<typeof X402Response>;
