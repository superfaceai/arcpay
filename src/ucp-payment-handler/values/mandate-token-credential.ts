import { z } from "zod";

export const UcpMandateTokenCredentialId = "arcpay_mandate_token_credential";

export const UcpMandateTokenCredential = z
  .object({
    type: z
      .literal("arcpay_mandate")
      .describe("Indicates this is a payment mandate token credential"),
    token: z
      .string()
      .describe(
        "The secret token of the payment mandate. This is the same value as `granted_mandate_secret` used in payment captures API."
      ),
    expires_at: z
      .string()
      .describe("The date and time the token expires at, in ISO 8601 format"),
  })
  .strict()
  .meta({
    title: "Arc Pay Mandate Token Credential",
    description:
      "Payment mandate token credential for the Arc Pay payment handler",
    allOf: [
      {
        $ref: "https://ucp.dev/schemas/shopping/types/token_credential.json",
      },
    ],
  });

export type UcpMandateTokenCredential = z.infer<
  typeof UcpMandateTokenCredential
>;
