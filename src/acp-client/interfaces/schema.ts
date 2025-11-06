import z from "zod";
import { codes } from "currency-codes";
import { toRFC3339 } from "@/lib";

const DateRFC3339 = z.codec(z.union([z.string(), z.date()]), z.date(), {
  decode: (inputDate) =>
    typeof inputDate === "string" ? new Date(inputDate) : inputDate,
  encode: (date) => toRFC3339(date),
});

// Enums
export const PaymentProviderName = z.enum([
  "stripe",
  "arcpay", // Not in ACP specification
]);

export const CheckoutStatus = z.enum([
  "not_ready_for_payment",
  "ready_for_payment",
  "completed",
  "canceled",
]);

const currencyCodes = codes().map((c) => c.toLowerCase()) as string[];
const Currency = z.enum(currencyCodes).describe("ISO-4217 currency code");

// Objects
const Item = z.object({
  id: z.string(),
  quantity: z.number().positive(),
});

const Address = z.object({
  name: z
    .string()
    .max(256)
    .describe("Name of the person to whom the items are shipped"),
  line_one: z.string().max(60).describe("First line of address"),
  line_two: z
    .string()
    .max(60)
    .optional()
    .describe("Optional second line of address"),
  city: z
    .string()
    .max(60)
    .describe("Address city/district/suburb/town/village."),
  state: z.string().max(60).describe("Address state/county/province/region."), // ISO 3166-1
  country: z.string().describe("Address country"), // ISO 3166-1
  postal_code: z.string().max(20).describe("Address postal code or zip code"),
  phone_number: z.string().optional().describe("Optional phone number"), // E.164
});

const PaymentProvider = z.object({
  provider: PaymentProviderName,
  supported_payment_methods: z.array(
    z.enum([
      "card",
      "wallet", // Not in ACP specification
    ])
  ),
});

const MessageInfo = z.object({
  type: z.literal("info"),
  param: z.string(), // RFC 9535 JSONPath to the component of the checkout session that the message is referring to. For instance, if the message is referring to the second line item, the path would be $.line_items[1]
  content_type: z.enum(["plain", "markdown"]),
  content: z.string(),
});
const MessageError = z.object({
  type: z.literal("error"),
  code: z.enum([
    "missing",
    "invalid",
    "out_of_stock",
    "payment_declined",
    "requires_sign_in",
    "requires_3ds",
  ]),
  param: z.string().optional(), // RFC 9535 JSONPath to the component of the checkout session that the message is referring to. For instance, if the message is referring to the second line item, the path would be $.line_items[1]
  content_type: z.enum(["plain", "markdown"]),
  content: z.string(),
});
const Message = z.discriminatedUnion("type", [MessageInfo, MessageError]);

const Buyer = z.object({
  first_name: z.string().max(256).describe("First name of buyer."),
  last_name: z.string().max(256).describe("Last name of buyer."),
  email: z
    .email()
    .max(256)
    .describe("Email address of buyer to be used for communication"),
  phone_number: z
    .string()
    .optional()
    .describe("Optional phone number of the buyer."), // E.164
});

const LineItem = z.object({
  id: z
    .string()
    .describe(
      "Id of the line item. This is different from the id of the item - two line items representing the same item will have different line item ids."
    ),
  item: Item,
  base_amount: z
    .number()
    .min(0)
    .describe("Integer representing item base amount before adjustments."),
  discount: z
    .number()
    .min(0)
    .describe("Integer representing any discount applied to the item."),
  subtotal: z
    .number()
    .min(0)
    .describe("Integer representing amount after all adjustments."),
  tax: z.number().min(0).describe("Integer representing tax amount."),
  total: z.number().min(0).describe("Integer representing total amount."),
});

const Link = z.object({
  type: z.enum(["terms_of_use", "privacy_policy", "seller_shop_policies"]),
  value: z.string(),
});

const Total = z.object({
  type: z.enum([
    "items_base_amount",
    "items_discount",
    "subtotal",
    "discount",
    "fulfillment",
    "tax",
    "fee",
    "total",
  ]),
  display_text: z
    .string()
    .describe("The text displayed to the customer for this total."),
  amount: z
    .number()
    .min(0)
    .describe("Integer representing total amount in minor units."),
});

const FulfillmentOptionShipping = z.object({
  type: z.literal("shipping"),
  id: z
    .string()
    .describe(
      "Unique ID that represents the shipping option. Unique across all fulfillment options."
    ),
  title: z
    .string()
    .describe("Title of the shipping option to display to the customer."),
  subtitle: z
    .string()
    .describe(
      "Text content describing the estimated timeline for shipping to display to the customer."
    ),
  carrier_info: z.string().describe("Name of the shipping carrier."),
  earliest_delivery_time: DateRFC3339.describe(
    "Estimated earliest delivery time"
  ),
  latest_delivery_time: DateRFC3339.describe("Estimated latest delivery time"),
  subtotal: z
    .number()
    .min(0)
    .describe(
      "Integer subtotal cost of the shipping option, formatted as a string."
    ),
  tax: z.number().min(0).describe("Integer representing tax amount."),
  total: z.number().min(0).describe("Integer representing total amount."),
});

const FulfillmentOptionDigital = z.object({
  type: z.literal("digital"),
  id: z
    .string()
    .describe(
      "Unique ID that represents the shipping option. Unique across all fulfillment options."
    ),
  title: z
    .string()
    .describe("Title of the digital option to display to the customer."),
  subtitle: z
    .string()
    .optional()
    .describe(
      "Text content describing how the item will be digitally delivered to the customer."
    ),
  subtotal: z
    .number()
    .min(0)
    .describe(
      "Integer subtotal cost of the digital option, formatted as a string."
    ),
  tax: z.number().min(0).describe("Integer representing tax amount."),
  total: z
    .number()
    .min(0)
    .describe(
      "Integer total cost of the digital option, formatted as a string."
    ),
});

const FulfillmentOption = z.discriminatedUnion("type", [
  FulfillmentOptionShipping,
  FulfillmentOptionDigital,
]);

const PaymentData = z.object({
  token: z.string("Token that represents the payment method."),
  provider: PaymentProviderName.describe(
    "String value representing the payment processor."
  ),
  billing_address: Address.optional().describe(
    "Optional billing address associated with the payment method"
  ),
});

const CheckoutSession = z.object({
  id: z.string(),
  buyer: Buyer.optional(),
  payment_provider: PaymentProvider,
  status: CheckoutStatus,
  currency: Currency,
  line_items: z.array(LineItem),
  fulfillment_address: Address.optional(),
  fulfillment_options: z.array(FulfillmentOption),
  fulfillment_option_id: z.string().optional(),
  totals: z.array(Total),
  messages: z.array(Message),
  links: z.array(Link),
});

// Errors
export const ResponseError = z.object({
  type: z.enum(["invalid_request"]),
  code: z.enum([
    "request_not_idempotent",
    "invalid_payload", // <- NOT BY ACP SPECIFICATION
  ]),
  message: z.string(),
  param: z.string().optional(), // JSONPath
});
export type ResponseError = z.infer<typeof ResponseError>;

// Create Checkout Session
export const CreateCheckoutSessionRequest = z.object({
  buyer: Buyer.optional(),
  items: z.array(Item).min(1),
  fulfillment_address: Address.optional(),
});
export type CreateCheckoutSessionRequest = z.infer<
  typeof CreateCheckoutSessionRequest
>;

export const CreateCheckoutSessionResponse = CheckoutSession;
export type CreateCheckoutSessionResponse = z.infer<
  typeof CreateCheckoutSessionResponse
>;

// Update Checkout Session
export const UpdateCheckoutSessionRequest = z.object({
  buyer: Buyer.optional(),
  items: z.array(Item).min(1).optional(),
  fulfillment_address: Address.optional(),
  fulfillment_option_id: z.string().optional(),
});
export type UpdateCheckoutSessionRequest = z.infer<
  typeof UpdateCheckoutSessionRequest
>;
export const UpdateCheckoutSessionResponse = CheckoutSession;
export type UpdateCheckoutSessionResponse = z.infer<
  typeof UpdateCheckoutSessionResponse
>;

// Complete Checkout Session
export const CompleteCheckoutSessionRequest = z.object({
  buyer: Buyer.optional(),
  payment_data: PaymentData,
});
export type CompleteCheckoutSessionRequest = z.infer<
  typeof CompleteCheckoutSessionRequest
>;
export const CompleteCheckoutSessionResponse = CheckoutSession;
export type CompleteCheckoutSessionResponse = z.infer<
  typeof CompleteCheckoutSessionResponse
>;

// Cancel Checkout Session
export const CancelCheckoutSessionResponse = CheckoutSession;
export type CancelCheckoutSessionResponse = z.infer<
  typeof CancelCheckoutSessionResponse
>;

// Get Checkout Session
export const GetCheckoutSessionResponse = CheckoutSession;
export type GetCheckoutSessionResponse = z.infer<
  typeof GetCheckoutSessionResponse
>;
