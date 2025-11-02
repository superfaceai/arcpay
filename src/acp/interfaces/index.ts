import z from "zod";
import { codes } from "currency-codes";
import { toRFC3339 } from "@/lib";

const DateRFC3339 = z.codec(z.union([z.string(), z.date()]), z.date(), {
  decode: (inputDate) =>
    typeof inputDate === "string" ? new Date(inputDate) : inputDate,
  encode: (date) => toRFC3339(date),
});

const currencyCodes = codes().map((c) => c.toLowerCase()) as string[];
const Currency = z.enum(currencyCodes).describe("ISO-4217 currency code");

const Metadata = z.record(z.string(), z.string());

export const Address = z.object({
  name: z.string().max(256).describe("Customer name"),
  line_one: z.string().max(60).describe("Street line 1"),
  line_two: z.string().max(60).optional().describe("Street line 2"),
  city: z.string().max(60).describe("City"),
  state: z
    .string()
    .max(60)
    .optional()
    .describe("State/region (ISO-3166-2 where applicable"), // ISO 3166-1
  country: z.string().describe("ISO-3166-1 alpha-2"), // ISO 3166-1
  postal_code: z.string().max(20).describe("Postal/ZIP code"),
});

const Allowance = z.object({
  reason: z.enum(["one_time"]),
  max_amount: z.number().describe("Maximum amount of the allowance"),
  currency: Currency.describe("Currency of the allowance"),
  checkout_session_id: z.string().describe("Reference to checkout session ID"),
  merchant_id: z.string().max(256).describe("Merchant identifying descriptor"),
  expires_at: DateRFC3339,
});

const RiskSignal = z.object({
  type: z.enum(["card_testing"]),
  score: z.number(),
  action: z.enum(["blocked", "manual_review", "authorized"]),
});

const PaymentMethodCard = z.object({
  type: z.literal("card"),
  card_number_type: z
    .enum(["fpan", "network_token"])
    .describe(
      "The type of card number. Network tokens are preferred with fallback to FPAN"
    ),
  number: z.string().length(16).describe("Card number"),
  exp_month: z.string().length(2).optional().describe("Expiration month"),
  exp_year: z.string().length(4).optional().describe("Expiration year"),
  cvc: z.string().max(4).optional().describe("Card CVC number"),
  name: z.string().optional().describe("Cardholder name"),
  cryptogram: z
    .string()
    .optional()
    .describe("Cryptogram provided with network tokens"),
  eci_value: z
    .string()
    .optional()
    .describe(
      "Electronic Commerce Indicator / Security Level Indicator provided with network tokens"
    ),
  checks_performed: z
    .array(z.string())
    .optional()
    .describe("Checks already performed on the card"),
  iin: z
    .string()
    .max(6)
    .optional()
    .describe(
      "Institution Identification Number (aka BIN). The first 6 digits on a card identifying the issuer"
    ),
  display_card_funding_type: z
    .enum(["credit", "debit", "prepaid"])
    .describe("Funding type of the card to display"),
  display_wallet_type: z
    .string()
    .optional()
    .describe("If the card came via a digital wallet, what type of wallet"),
  display_brand: z.string().optional().describe("Brand of the card to display"),
  display_last4: z
    .string()
    .max(4)
    .optional()
    .describe(
      "In case of non-PAN, this is the original last 4 digits of the card for customer display"
    ),
  metadata: Metadata,
});

// Wallet is not part of ACP specification
const PaymentMethodWallet = z.object({
  type: z.literal("wallet"),
  // TODO
});

const PaymentMethod = z.discriminatedUnion("type", [
  PaymentMethodCard,
  PaymentMethodWallet,
]);

export const ResponseError = z.object({
  type: z.enum([
    "invalid_request",
    "rate_limit_exceeded",
    "processing_error",
    "service_unavailable",
  ]),
  code: z.enum([
    "invalid_card",
    "duplicate_request",
    "idempotency_conflict",
    "invalid_request", // not part of ACP specification
  ]),
  message: z.string(),
  param: z.string().optional(),
});
export type ResponseError = z.infer<typeof ResponseError>;

// Delegate Payment
export const DelegatePaymentRequest = z.object({
  payment_method: PaymentMethod,
  allowance: Allowance,
  billing_address: Address.optional(),
  risk_signals: z.array(RiskSignal),
  metadata: Metadata,
});
export type DelegatePaymentRequest = z.infer<typeof DelegatePaymentRequest>;

export const DelegatePaymentResponse = z.object({
  id: z.string(),
  created: DateRFC3339,
  metadata: Metadata,
});
export type DelegatePaymentResponse = z.infer<typeof DelegatePaymentResponse>;
