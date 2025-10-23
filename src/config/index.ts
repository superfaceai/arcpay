import "dotenv/config";
import { z } from "zod";
import { BLOCKCHAINS } from "@/payments/values";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  IS_PRODUCTION: z.preprocess((env) => env === "production", z.boolean()),
  CIRCLE_API_KEY: z.string().min(1),
  CIRCLE_ENTITY_SECRET: z.string().min(1),
  CIRCLE_WALLETSET_ID: z.string().min(1),
  DEFAULT_BLOCKCHAIN: z.enum(BLOCKCHAINS),
  REDIS_REST_URL: z.string().min(1),
  REDIS_REST_TOKEN: z.string().min(1),
});

const parsedConfig = ConfigSchema.safeParse(process.env);

if (!parsedConfig.success) {
  const errors = parsedConfig.error.issues
    .map((issue) => `${issue.path.join("/")}: ${issue.message}`)
    .join(", ");

  throw new Error(`Invalid environment variables: ${errors}`);
}

export const Config = parsedConfig.data;
export default Config;
