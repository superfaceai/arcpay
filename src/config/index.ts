import { BLOCKCHAINS } from "@/balances/values";

import "dotenv/config";
import { z } from "zod";

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  IS_PRODUCTION: z.preprocess((env) => env === "production", z.boolean()),
  SESSION_SECRET: z.string().min(1),
  CIRCLE_API_KEY: z.string().min(1),
  CIRCLE_ENTITY_SECRET: z.string().min(1),
  CIRCLE_WALLETSET_ID: z.string().min(1),
  REDIS_REST_URL: z.string().min(1),
  REDIS_REST_TOKEN: z.string().min(1),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional(),

  FEATURE_INITIAL_FUNDING_ENABLED: z
    .preprocess((env) => env === "true", z.boolean())
    .default(false),
  FEATURE_INITIAL_FUNDING_AMOUNT_USDC: z.string().optional(),
  FEATURE_INITIAL_FUNDING_MAX_USE_COUNT: z
    .preprocess((env: string) => parseInt(env), z.number())
    .optional(),
  FEATURE_INITIAL_FUNDING_BLOCKCHAIN: z.enum(BLOCKCHAINS).optional(),
  FEATURE_INITIAL_FUNDING_BLOCKCHAIN_PRIVATEKEY: z.string().min(3).optional(),

  FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_ENABLED: z
    .preprocess((env) => env === "true", z.boolean())
    .default(false),
  FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_BLOCKCHAIN: z
    .enum(BLOCKCHAINS)
    .optional(),
  FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_ADDRESS: z
    .string()
    .min(3)
    .optional(),
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
