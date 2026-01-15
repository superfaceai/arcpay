import { z } from "zod";

export const ConfigEnvironment = z.enum(["sandbox", "production"]);
export type ConfigEnvironment = z.infer<typeof ConfigEnvironment>;

export const UcpConfigId = "arcpay_config";

export const UcpConfig = z
  .object({
    environment: ConfigEnvironment.default("sandbox").describe(
      "The environment to use for the payment"
    ),
    merchant_id: z
      .string()
      .describe(
        "The Arc Pay merchant ID that will be authorized to pull the payment. Merchant ID is your Arc Pay handle, you can find it at /my-account"
      ),
    // webhook_url: z.url().optional(),
  })
  .strict()
  .meta({
    title: "Arc Pay Config",
    description: "Configuration for the Arc Pay payment handler",
  });

export type UcpConfig = z.infer<typeof UcpConfig>;
