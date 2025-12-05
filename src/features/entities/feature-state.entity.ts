import { z } from "zod";

export const FeatureState = z.object({
  key: z.string(),
  value: z.any().transform((v) => typeof v === "string" ? v : JSON.stringify(v)),
  live: z.boolean(),
});

export type FeatureState = z.infer<typeof FeatureState>;
