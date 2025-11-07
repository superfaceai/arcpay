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
