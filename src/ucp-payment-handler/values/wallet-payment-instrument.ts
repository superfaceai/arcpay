import { z } from "zod";
import { UcpMandateTokenCredential } from "./mandate-token-credential";

export const UcpWalletPaymentInstrumentId = "arcpay_wallet_payment_instrument";

export const UcpWalletPaymentInstrument = z
  .object({
    type: z
      .literal("wallet")
      .describe("Indicates this is a wallet payment instrument"),
    credential: UcpMandateTokenCredential,
    rich_text_description: z
      .string()
      .optional()
      .describe(
        "An optional rich text description of the wallet to display to the user (e.g., 'Dash Agent's Wallet')."
      ),
  })
  .strict()
  .meta({
    title: "Arc Pay Wallet Payment Instrument",
    description: "Wallet payment instrument for the Arc Pay payment handler",

    // NOTE: We're extending and _violating_ UCP's Payment Instrument
    // schema with our custom type. UCP only support type=card.
    // allOf: [
    //   {
    //     $ref: "https://ucp.dev/schemas/shopping/types/payment_instrument.json",
    //   },
    // ],
  });

export type UcpWalletPaymentInstrument = z.infer<
  typeof UcpWalletPaymentInstrument
>;
