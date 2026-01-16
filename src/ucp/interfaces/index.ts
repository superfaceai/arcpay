import { z } from "zod";

/**
 * Generated from the UCP Reference.
 * Source: https://ucp.dev/specification/reference/
 */

// Checkout Create Request
export const CheckoutCreateRequest = z.object({
  line_items: z.array(z.lazy(() => LineItemCreateRequest)),
  buyer: z.lazy(() => Buyer).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentCreateRequest),
}).strict();
export type CheckoutCreateRequest = z.infer<typeof CheckoutCreateRequest>;

// Checkout Update Request
export const CheckoutUpdateRequest = z.object({
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemUpdateRequest)),
  buyer: z.lazy(() => Buyer).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentUpdateRequest),
}).strict();
export type CheckoutUpdateRequest = z.infer<typeof CheckoutUpdateRequest>;

// Checkout Response
export const CheckoutResponse = z.object({
  ucp: z.lazy(() => UcpResponseCheckout),
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemResponse)),
  buyer: z.lazy(() => Buyer).optional(),
  status: z.enum(["incomplete", "requires_escalation", "ready_for_complete", "complete_in_progress", "completed", "canceled"]),
  currency: z.string(),
  totals: z.array(z.lazy(() => TotalResponse)),
  messages: z.array(z.lazy(() => Message)).optional(),
  links: z.array(z.lazy(() => Link)),
  expires_at: z.string().optional(),
  continue_url: z.string().optional(),
  payment: z.lazy(() => PaymentResponse),
  order: z.lazy(() => OrderConfirmation).optional(),
}).strict();
export type CheckoutResponse = z.infer<typeof CheckoutResponse>;

// Order
export const Order = z.object({
  ucp: z.lazy(() => UcpResponseOrder),
  id: z.string(),
  checkout_id: z.string(),
  permalink_url: z.string(),
  line_items: z.array(z.lazy(() => OrderLineItem)),
  fulfillment: z.record(z.string(), z.any()),
  adjustments: z.array(z.lazy(() => Adjustment)).optional(),
  totals: z.array(z.lazy(() => TotalResponse)),
}).strict();
export type Order = z.infer<typeof Order>;

// Payment Create Request
export const PaymentCreateRequest = z.object({
  selected_instrument_id: z.string().optional(),
  instruments: z.array(z.lazy(() => PaymentInstrument)).optional(),
}).strict();
export type PaymentCreateRequest = z.infer<typeof PaymentCreateRequest>;

// Payment Update Request
export const PaymentUpdateRequest = z.object({
  selected_instrument_id: z.string().optional(),
  instruments: z.array(z.lazy(() => PaymentInstrument)).optional(),
}).strict();
export type PaymentUpdateRequest = z.infer<typeof PaymentUpdateRequest>;

// Payment Data
export const PaymentData = z.object({
  payment_data: z.lazy(() => PaymentInstrument),
}).strict();
export type PaymentData = z.infer<typeof PaymentData>;

// Payment Response
export const PaymentResponse = z.object({
  handlers: z.array(z.lazy(() => PaymentHandlerResponse)),
  selected_instrument_id: z.string().optional(),
  instruments: z.array(z.lazy(() => PaymentInstrument)).optional(),
}).strict();
export type PaymentResponse = z.infer<typeof PaymentResponse>;

// Payment Account Info
export const PaymentAccountInfo = z.object({
  payment_account_reference: z.string().optional(),
}).strict();
export type PaymentAccountInfo = z.infer<typeof PaymentAccountInfo>;

// Adjustment
export const Adjustment = z.object({
  id: z.string(),
  type: z.string(),
  occurred_at: z.string(),
  status: z.enum(["pending", "completed", "failed"]),
  line_items: z.array(z.record(z.string(), z.any())).optional(),
  amount: z.number().int().optional(),
  description: z.string().optional(),
}).strict();
export type Adjustment = z.infer<typeof Adjustment>;

// Binding
export const Binding = z.object({
  checkout_id: z.string(),
  identity: z.lazy(() => PaymentIdentity).optional(),
}).strict();
export type Binding = z.infer<typeof Binding>;

// Buyer
export const Buyer = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
}).strict();
export type Buyer = z.infer<typeof Buyer>;

// Card Credential
export const CardCredential = z.object({
  type: z.literal("card"),
  card_number_type: z.enum(["fpan", "network_token", "dpan"]),
  number: z.string().optional(),
  expiry_month: z.number().int().optional(),
  expiry_year: z.number().int().optional(),
  name: z.string().optional(),
  cvc: z.string().optional(),
  cryptogram: z.string().optional(),
  eci_value: z.string().optional(),
}).strict();
export type CardCredential = z.infer<typeof CardCredential>;

// Card Payment Instrument
export const CardPaymentInstrument = z.object({
  id: z.string(),
  handler_id: z.string(),
  billing_address: z.lazy(() => PostalAddress).optional(),
  credential: z.lazy(() => PaymentCredential).optional(),
  type: z.literal("card"),
  brand: z.string(),
  last_digits: z.string(),
  expiry_month: z.number().int().optional(),
  expiry_year: z.number().int().optional(),
  rich_text_description: z.string().optional(),
  rich_card_art: z.string().optional(),
}).strict();
export type CardPaymentInstrument = z.infer<typeof CardPaymentInstrument>;

// Expectation
export const Expectation = z.object({
  id: z.string(),
  line_items: z.array(z.record(z.string(), z.any())),
  method_type: z.enum(["shipping", "pickup", "digital"]),
  destination: z.lazy(() => PostalAddress),
  description: z.string().optional(),
  fulfillable_on: z.string().optional(),
}).strict();
export type Expectation = z.infer<typeof Expectation>;

// Fulfillment Available Method Response
export const FulfillmentAvailableMethodResponse = z.object({
  type: z.enum(["shipping", "pickup"]),
  line_item_ids: z.array(z.string()),
  fulfillable_on: z.string().nullable().optional(),
  description: z.string().optional(),
}).strict();
export type FulfillmentAvailableMethodResponse = z.infer<typeof FulfillmentAvailableMethodResponse>;

// Fulfillment Destination Request
export const FulfillmentDestinationRequest = z.union([z.lazy(() => ShippingDestinationRequest), z.lazy(() => RetailLocationRequest)]);
export type FulfillmentDestinationRequest = z.infer<typeof FulfillmentDestinationRequest>;

// Fulfillment Destination Response
export const FulfillmentDestinationResponse = z.union([z.lazy(() => ShippingDestinationResponse), z.lazy(() => RetailLocationResponse)]);
export type FulfillmentDestinationResponse = z.infer<typeof FulfillmentDestinationResponse>;

// Fulfillment Event
export const FulfillmentEvent = z.object({
  id: z.string(),
  occurred_at: z.string(),
  type: z.string(),
  line_items: z.array(z.record(z.string(), z.any())),
  tracking_number: z.string().optional(),
  tracking_url: z.string().optional(),
  carrier: z.string().optional(),
  description: z.string().optional(),
}).strict();
export type FulfillmentEvent = z.infer<typeof FulfillmentEvent>;

// Fulfillment Group Create Request
export const FulfillmentGroupCreateRequest = z.object({
  selected_option_id: z.string().nullable().optional(),
}).strict();
export type FulfillmentGroupCreateRequest = z.infer<typeof FulfillmentGroupCreateRequest>;

// Fulfillment Group Update Request
export const FulfillmentGroupUpdateRequest = z.object({
  id: z.string(),
  selected_option_id: z.string().nullable().optional(),
}).strict();
export type FulfillmentGroupUpdateRequest = z.infer<typeof FulfillmentGroupUpdateRequest>;

// Fulfillment Group Response
export const FulfillmentGroupResponse = z.object({
  id: z.string(),
  line_item_ids: z.array(z.string()),
  options: z.array(z.lazy(() => FulfillmentOptionResponse)).optional(),
  selected_option_id: z.string().nullable().optional(),
}).strict();
export type FulfillmentGroupResponse = z.infer<typeof FulfillmentGroupResponse>;

// Fulfillment Method Create Request
export const FulfillmentMethodCreateRequest = z.object({
  type: z.enum(["shipping", "pickup"]),
  line_item_ids: z.array(z.string()).optional(),
  destinations: z.array(z.lazy(() => FulfillmentDestinationRequest)).optional(),
  selected_destination_id: z.string().nullable().optional(),
  groups: z.array(z.lazy(() => FulfillmentGroupCreateRequest)).optional(),
}).strict();
export type FulfillmentMethodCreateRequest = z.infer<typeof FulfillmentMethodCreateRequest>;

// Fulfillment Method Update Request
export const FulfillmentMethodUpdateRequest = z.object({
  id: z.string(),
  line_item_ids: z.array(z.string()),
  destinations: z.array(z.lazy(() => FulfillmentDestinationRequest)).optional(),
  selected_destination_id: z.string().nullable().optional(),
  groups: z.array(z.lazy(() => FulfillmentGroupUpdateRequest)).optional(),
}).strict();
export type FulfillmentMethodUpdateRequest = z.infer<typeof FulfillmentMethodUpdateRequest>;

// Fulfillment Method Response
export const FulfillmentMethodResponse = z.object({
  id: z.string(),
  type: z.enum(["shipping", "pickup"]),
  line_item_ids: z.array(z.string()),
  destinations: z.array(z.lazy(() => FulfillmentDestinationResponse)).optional(),
  selected_destination_id: z.string().nullable().optional(),
  groups: z.array(z.lazy(() => FulfillmentGroupResponse)).optional(),
}).strict();
export type FulfillmentMethodResponse = z.infer<typeof FulfillmentMethodResponse>;

// Fulfillment Option Response
export const FulfillmentOptionResponse = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  carrier: z.string().optional(),
  earliest_fulfillment_time: z.string().optional(),
  latest_fulfillment_time: z.string().optional(),
  totals: z.array(z.lazy(() => TotalResponse)),
}).strict();
export type FulfillmentOptionResponse = z.infer<typeof FulfillmentOptionResponse>;

// Fulfillment Request
export const FulfillmentRequest = z.object({
  methods: z.array(z.lazy(() => FulfillmentMethodCreateRequest)).optional(),
}).strict();
export type FulfillmentRequest = z.infer<typeof FulfillmentRequest>;

// Fulfillment Response
export const FulfillmentResponse = z.object({
  methods: z.array(z.lazy(() => FulfillmentMethodResponse)).optional(),
  available_methods: z.array(z.lazy(() => FulfillmentAvailableMethodResponse)).optional(),
}).strict();
export type FulfillmentResponse = z.infer<typeof FulfillmentResponse>;

// Item Create Request
export const ItemCreateRequest = z.object({
  id: z.string(),
}).strict();
export type ItemCreateRequest = z.infer<typeof ItemCreateRequest>;

// Item Update Request
export const ItemUpdateRequest = z.object({
  id: z.string(),
}).strict();
export type ItemUpdateRequest = z.infer<typeof ItemUpdateRequest>;

// Item Response
export const ItemResponse = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number().int(),
  image_url: z.string().optional(),
}).strict();
export type ItemResponse = z.infer<typeof ItemResponse>;

// Line Item Create Request
export const LineItemCreateRequest = z.object({
  item: z.lazy(() => ItemCreateRequest),
  quantity: z.number().int(),
}).strict();
export type LineItemCreateRequest = z.infer<typeof LineItemCreateRequest>;

// Line Item Update Request
export const LineItemUpdateRequest = z.object({
  id: z.string().optional(),
  item: z.lazy(() => ItemUpdateRequest),
  quantity: z.number().int(),
  parent_id: z.string().optional(),
}).strict();
export type LineItemUpdateRequest = z.infer<typeof LineItemUpdateRequest>;

// Line Item Response
export const LineItemResponse = z.object({
  id: z.string(),
  item: z.lazy(() => ItemResponse),
  quantity: z.number().int(),
  totals: z.array(z.lazy(() => TotalResponse)),
  parent_id: z.string().optional(),
}).strict();
export type LineItemResponse = z.infer<typeof LineItemResponse>;

// Link
export const Link = z.object({
  type: z.string(),
  url: z.string(),
  title: z.string().optional(),
}).strict();
export type Link = z.infer<typeof Link>;

// Merchant Fulfillment Config
export const MerchantFulfillmentConfig = z.object({
  allows_multi_destination: z.record(z.string(), z.any()).optional(),
  allows_method_combinations: z.array(z.unknown()).optional(),
}).strict();
export type MerchantFulfillmentConfig = z.infer<typeof MerchantFulfillmentConfig>;

// Message
export const Message = z.union([z.lazy(() => MessageError), z.lazy(() => MessageWarning), z.lazy(() => MessageInfo)]);
export type Message = z.infer<typeof Message>;

// Message Error
export const MessageError = z.object({
  type: z.literal("error"),
  code: z.string(),
  path: z.string().optional(),
  content_type: z.enum(["plain", "markdown"]).optional(),
  content: z.string(),
  severity: z.enum(["recoverable", "requires_buyer_input", "requires_buyer_review"]),
}).strict();
export type MessageError = z.infer<typeof MessageError>;

// Message Info
export const MessageInfo = z.object({
  type: z.literal("info"),
  path: z.string().optional(),
  code: z.string().optional(),
  content_type: z.enum(["plain", "markdown"]).optional(),
  content: z.string(),
}).strict();
export type MessageInfo = z.infer<typeof MessageInfo>;

// Message Warning
export const MessageWarning = z.object({
  type: z.literal("warning"),
  path: z.string().optional(),
  code: z.string(),
  content: z.string(),
  content_type: z.enum(["plain", "markdown"]).optional(),
}).strict();
export type MessageWarning = z.infer<typeof MessageWarning>;

// Order Confirmation
export const OrderConfirmation = z.object({
  id: z.string(),
  permalink_url: z.string(),
}).strict();
export type OrderConfirmation = z.infer<typeof OrderConfirmation>;

// Order Line Item
export const OrderLineItem = z.object({
  id: z.string(),
  item: z.lazy(() => ItemResponse),
  quantity: z.record(z.string(), z.any()),
  totals: z.array(z.lazy(() => TotalResponse)),
  status: z.enum(["processing", "partial", "fulfilled"]),
  parent_id: z.string().optional(),
}).strict();
export type OrderLineItem = z.infer<typeof OrderLineItem>;

// Payment Credential
export const PaymentCredential = z.union([z.lazy(() => TokenCredentialResponse), z.lazy(() => CardCredential)]);
export type PaymentCredential = z.infer<typeof PaymentCredential>;

// Payment Handler Response
export const PaymentHandlerResponse = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  spec: z.string(),
  config_schema: z.string(),
  instrument_schemas: z.array(z.string()),
  config: z.record(z.string(), z.any()),
}).strict();
export type PaymentHandlerResponse = z.infer<typeof PaymentHandlerResponse>;

// Payment Identity
export const PaymentIdentity = z.object({
  access_token: z.string(),
}).strict();
export type PaymentIdentity = z.infer<typeof PaymentIdentity>;

// Payment Instrument
export const PaymentInstrument = z.union([z.lazy(() => CardPaymentInstrument)]);
export type PaymentInstrument = z.infer<typeof PaymentInstrument>;

// Payment Instrument Base
export const PaymentInstrumentBase = z.object({
  id: z.string(),
  handler_id: z.string(),
  type: z.string(),
  billing_address: z.lazy(() => PostalAddress).optional(),
  credential: z.lazy(() => PaymentCredential).optional(),
}).strict();
export type PaymentInstrumentBase = z.infer<typeof PaymentInstrumentBase>;

// Platform Fulfillment Config
export const PlatformFulfillmentConfig = z.object({
  supports_multi_group: z.boolean().optional(),
}).strict();
export type PlatformFulfillmentConfig = z.infer<typeof PlatformFulfillmentConfig>;

// Postal Address
export const PostalAddress = z.object({
  extended_address: z.string().optional(),
  street_address: z.string().optional(),
  address_locality: z.string().optional(),
  address_region: z.string().optional(),
  address_country: z.string().optional(),
  postal_code: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  phone_number: z.string().optional(),
}).strict();
export type PostalAddress = z.infer<typeof PostalAddress>;

// Retail Location Request
export const RetailLocationRequest = z.object({
  name: z.string(),
  address: z.lazy(() => PostalAddress).optional(),
}).strict();
export type RetailLocationRequest = z.infer<typeof RetailLocationRequest>;

// Retail Location Response
export const RetailLocationResponse = z.object({
  id: z.string(),
  name: z.string(),
  address: z.lazy(() => PostalAddress).optional(),
}).strict();
export type RetailLocationResponse = z.infer<typeof RetailLocationResponse>;

// Shipping Destination Request
export const ShippingDestinationRequest = z.object({
  extended_address: z.string().optional(),
  street_address: z.string().optional(),
  address_locality: z.string().optional(),
  address_region: z.string().optional(),
  address_country: z.string().optional(),
  postal_code: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  phone_number: z.string().optional(),
  id: z.string().optional(),
}).strict();
export type ShippingDestinationRequest = z.infer<typeof ShippingDestinationRequest>;

// Shipping Destination Response
export const ShippingDestinationResponse = z.object({
  extended_address: z.string().optional(),
  street_address: z.string().optional(),
  address_locality: z.string().optional(),
  address_region: z.string().optional(),
  address_country: z.string().optional(),
  postal_code: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  phone_number: z.string().optional(),
  id: z.string(),
}).strict();
export type ShippingDestinationResponse = z.infer<typeof ShippingDestinationResponse>;

// Token Credential Create Request
export const TokenCredentialCreateRequest = z.object({
  type: z.string(),
  token: z.string(),
}).strict();
export type TokenCredentialCreateRequest = z.infer<typeof TokenCredentialCreateRequest>;

// Token Credential Update Request
export const TokenCredentialUpdateRequest = z.object({
  type: z.string(),
  token: z.string(),
}).strict();
export type TokenCredentialUpdateRequest = z.infer<typeof TokenCredentialUpdateRequest>;

// Token Credential Response
export const TokenCredentialResponse = z.object({
  type: z.string(),
}).strict();
export type TokenCredentialResponse = z.infer<typeof TokenCredentialResponse>;

// Total Response
export const TotalResponse = z.object({
  type: z.enum(["items_discount", "subtotal", "discount", "fulfillment", "tax", "fee", "total"]),
  display_text: z.string().optional(),
  amount: z.number().int(),
}).strict();
export type TotalResponse = z.infer<typeof TotalResponse>;

// Merchant Authorization
export const MerchantAuthorization = z.string().regex(new RegExp("^[A-Za-z0-9_-]+\\.\\.[A-Za-z0-9_-]+$"));
export type MerchantAuthorization = z.infer<typeof MerchantAuthorization>;

// Checkout Mandate
export const CheckoutMandate = z.string().regex(new RegExp("^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]*\\.[A-Za-z0-9_-]+(~[A-Za-z0-9_-]+)*$"));
export type CheckoutMandate = z.infer<typeof CheckoutMandate>;

// AP2 Checkout Response Object
export const AP2CheckoutResponseObject = z.object({
  merchant_authorization: z.lazy(() => MerchantAuthorization),
}).strict();
export type AP2CheckoutResponseObject = z.infer<typeof AP2CheckoutResponseObject>;

// AP2 Complete Request Object
export const AP2CompleteRequestObject = z.object({
  checkout_mandate: z.lazy(() => CheckoutMandate),
}).strict();
export type AP2CompleteRequestObject = z.infer<typeof AP2CompleteRequestObject>;

// AP2 Error Code
export const AP2ErrorCode = z.enum(["mandate_required", "agent_missing_key", "mandate_invalid_signature", "mandate_expired", "mandate_scope_mismatch", "merchant_authorization_invalid", "merchant_authorization_missing"]);
export type AP2ErrorCode = z.infer<typeof AP2ErrorCode>;

// Checkout with AP2 Mandate
export const CheckoutWithAP2Mandate = z.object({
  ucp: z.lazy(() => UcpResponseCheckout),
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemResponse)),
  buyer: z.lazy(() => Buyer).optional(),
  status: z.enum(["incomplete", "requires_escalation", "ready_for_complete", "complete_in_progress", "completed", "canceled"]),
  currency: z.string(),
  totals: z.array(z.lazy(() => TotalResponse)),
  messages: z.array(z.lazy(() => Message)).optional(),
  links: z.array(z.lazy(() => Link)),
  expires_at: z.string().optional(),
  continue_url: z.string().optional(),
  payment: z.lazy(() => PaymentResponse),
  order: z.lazy(() => OrderConfirmation).optional(),
  ap2: z.lazy(() => AP2CheckoutResponseObject).optional(),
}).strict();
export type CheckoutWithAP2Mandate = z.infer<typeof CheckoutWithAP2Mandate>;

// Complete Checkout Request with AP2
export const CompleteCheckoutRequestWithAP2 = z.object({
  ap2: z.lazy(() => AP2CompleteRequestObject).optional(),
}).strict();
export type CompleteCheckoutRequestWithAP2 = z.infer<typeof CompleteCheckoutRequestWithAP2>;

// Consent
export const Consent = z.object({
  analytics: z.boolean().optional(),
  preferences: z.boolean().optional(),
  marketing: z.boolean().optional(),
  sale_of_data: z.boolean().optional(),
}).strict();
export type Consent = z.infer<typeof Consent>;

// Buyer with Consent Create Request
export const BuyerWithConsentCreateRequest = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  consent: z.lazy(() => Consent).optional(),
}).strict();
export type BuyerWithConsentCreateRequest = z.infer<typeof BuyerWithConsentCreateRequest>;

// Checkout with Buyer Consent Create Request
export const CheckoutWithBuyerConsentCreateRequest = z.object({
  line_items: z.array(z.lazy(() => LineItemCreateRequest)),
  buyer: z.lazy(() => BuyerWithConsentCreateRequest).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentCreateRequest),
}).strict();
export type CheckoutWithBuyerConsentCreateRequest = z.infer<typeof CheckoutWithBuyerConsentCreateRequest>;

// Buyer with Consent Update Request
export const BuyerWithConsentUpdateRequest = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  consent: z.lazy(() => Consent).optional(),
}).strict();
export type BuyerWithConsentUpdateRequest = z.infer<typeof BuyerWithConsentUpdateRequest>;

// Checkout with Buyer Consent Update Request
export const CheckoutWithBuyerConsentUpdateRequest = z.object({
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemUpdateRequest)),
  buyer: z.lazy(() => BuyerWithConsentUpdateRequest).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentUpdateRequest),
}).strict();
export type CheckoutWithBuyerConsentUpdateRequest = z.infer<typeof CheckoutWithBuyerConsentUpdateRequest>;

// Buyer with Consent Response
export const BuyerWithConsentResponse = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  full_name: z.string().optional(),
  email: z.string().optional(),
  phone_number: z.string().optional(),
  consent: z.lazy(() => Consent).optional(),
}).strict();
export type BuyerWithConsentResponse = z.infer<typeof BuyerWithConsentResponse>;

// Checkout with Buyer Consent Response
export const CheckoutWithBuyerConsentResponse = z.object({
  ucp: z.lazy(() => UcpResponseCheckout),
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemResponse)),
  buyer: z.lazy(() => BuyerWithConsentResponse).optional(),
  status: z.enum(["incomplete", "requires_escalation", "ready_for_complete", "complete_in_progress", "completed", "canceled"]),
  currency: z.string(),
  totals: z.array(z.lazy(() => TotalResponse)),
  messages: z.array(z.lazy(() => Message)).optional(),
  links: z.array(z.lazy(() => Link)),
  expires_at: z.string().optional(),
  continue_url: z.string().optional(),
  payment: z.lazy(() => PaymentResponse),
  order: z.lazy(() => OrderConfirmation).optional(),
}).strict();
export type CheckoutWithBuyerConsentResponse = z.infer<typeof CheckoutWithBuyerConsentResponse>;

// Allocation
export const Allocation = z.object({
  path: z.string(),
  amount: z.number().int(),
}).strict();
export type Allocation = z.infer<typeof Allocation>;

// Applied Discount
export const AppliedDiscount = z.object({
  code: z.string().optional(),
  title: z.string(),
  amount: z.number().int(),
  automatic: z.boolean().optional(),
  method: z.enum(["each", "across"]).optional(),
  priority: z.number().int().optional(),
  allocations: z.array(z.lazy(() => Allocation)).optional(),
}).strict();
export type AppliedDiscount = z.infer<typeof AppliedDiscount>;

// Discounts Object
export const DiscountsObject = z.object({
  codes: z.array(z.string()).optional(),
  applied: z.array(z.lazy(() => AppliedDiscount)).optional(),
}).strict();
export type DiscountsObject = z.infer<typeof DiscountsObject>;

// Checkout with Discount Create Request
export const CheckoutWithDiscountCreateRequest = z.object({
  line_items: z.array(z.lazy(() => LineItemCreateRequest)),
  buyer: z.lazy(() => Buyer).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentCreateRequest),
  discounts: z.lazy(() => DiscountsObject).optional(),
}).strict();
export type CheckoutWithDiscountCreateRequest = z.infer<typeof CheckoutWithDiscountCreateRequest>;

// Checkout with Discount Update Request
export const CheckoutWithDiscountUpdateRequest = z.object({
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemUpdateRequest)),
  buyer: z.lazy(() => Buyer).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentUpdateRequest),
  discounts: z.lazy(() => DiscountsObject).optional(),
}).strict();
export type CheckoutWithDiscountUpdateRequest = z.infer<typeof CheckoutWithDiscountUpdateRequest>;

// Checkout with Discount Response
export const CheckoutWithDiscountResponse = z.object({
  ucp: z.lazy(() => UcpResponseCheckout),
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemResponse)),
  buyer: z.lazy(() => Buyer).optional(),
  status: z.enum(["incomplete", "requires_escalation", "ready_for_complete", "complete_in_progress", "completed", "canceled"]),
  currency: z.string(),
  totals: z.array(z.lazy(() => TotalResponse)),
  messages: z.array(z.lazy(() => Message)).optional(),
  links: z.array(z.lazy(() => Link)),
  expires_at: z.string().optional(),
  continue_url: z.string().optional(),
  payment: z.lazy(() => PaymentResponse),
  order: z.lazy(() => OrderConfirmation).optional(),
  discounts: z.lazy(() => DiscountsObject).optional(),
}).strict();
export type CheckoutWithDiscountResponse = z.infer<typeof CheckoutWithDiscountResponse>;

// Fulfillment Group
export const FulfillmentGroup = z.object({
  selected_option_id: z.string().nullable().optional(),
}).strict();
export type FulfillmentGroup = z.infer<typeof FulfillmentGroup>;

// Fulfillment Method
export const FulfillmentMethod = z.object({
  type: z.enum(["shipping", "pickup"]),
  line_item_ids: z.array(z.string()).optional(),
  destinations: z.array(z.lazy(() => FulfillmentDestinationRequest)).optional(),
  selected_destination_id: z.string().nullable().optional(),
  groups: z.array(z.lazy(() => FulfillmentGroupCreateRequest)).optional(),
}).strict();
export type FulfillmentMethod = z.infer<typeof FulfillmentMethod>;

// Fulfillment (Extension Schema - used in responses, matches FulfillmentResponse)
export const Fulfillment = z.lazy(() => FulfillmentResponse);
export type Fulfillment = z.infer<typeof Fulfillment>;

// Checkout with Fulfillment Create Request
export const CheckoutWithFulfillmentCreateRequest = z.object({
  line_items: z.array(z.lazy(() => LineItemCreateRequest)),
  buyer: z.lazy(() => Buyer).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentCreateRequest),
  fulfillment: z.lazy(() => FulfillmentRequest).optional(),
}).strict();
export type CheckoutWithFulfillmentCreateRequest = z.infer<typeof CheckoutWithFulfillmentCreateRequest>;

// Checkout with Fulfillment Update Request
export const CheckoutWithFulfillmentUpdateRequest = z.object({
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemUpdateRequest)),
  buyer: z.lazy(() => Buyer).optional(),
  currency: z.string(),
  payment: z.lazy(() => PaymentUpdateRequest),
  fulfillment: z.lazy(() => FulfillmentRequest).optional(),
}).strict();
export type CheckoutWithFulfillmentUpdateRequest = z.infer<typeof CheckoutWithFulfillmentUpdateRequest>;

// Fulfillment Option
export const FulfillmentOption = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  carrier: z.string().optional(),
  earliest_fulfillment_time: z.string().optional(),
  latest_fulfillment_time: z.string().optional(),
  totals: z.array(z.lazy(() => TotalResponse)),
}).strict();
export type FulfillmentOption = z.infer<typeof FulfillmentOption>;

// Fulfillment Available Method
export const FulfillmentAvailableMethod = z.object({
  type: z.enum(["shipping", "pickup"]),
  line_item_ids: z.array(z.string()),
  fulfillable_on: z.string().nullable().optional(),
  description: z.string().optional(),
}).strict();
export type FulfillmentAvailableMethod = z.infer<typeof FulfillmentAvailableMethod>;

// Checkout with Fulfillment Response
export const CheckoutWithFulfillmentResponse = z.object({
  ucp: z.lazy(() => UcpResponseCheckout),
  id: z.string(),
  line_items: z.array(z.lazy(() => LineItemResponse)),
  buyer: z.lazy(() => Buyer).optional(),
  status: z.enum(["incomplete", "requires_escalation", "ready_for_complete", "complete_in_progress", "completed", "canceled"]),
  currency: z.string(),
  totals: z.array(z.lazy(() => TotalResponse)),
  messages: z.array(z.lazy(() => Message)).optional(),
  links: z.array(z.lazy(() => Link)),
  expires_at: z.string().optional(),
  continue_url: z.string().optional(),
  payment: z.lazy(() => PaymentResponse),
  order: z.lazy(() => OrderConfirmation).optional(),
  fulfillment: z.lazy(() => FulfillmentResponse).optional(),
}).strict();
export type CheckoutWithFulfillmentResponse = z.infer<typeof CheckoutWithFulfillmentResponse>;

// Discovery Profile
export const DiscoveryProfile = z.object({
  version: z.string(),
  services: z.lazy(() => Services),
  capabilities: z.array(z.lazy(() => Discovery)),
}).strict();
export type DiscoveryProfile = z.infer<typeof DiscoveryProfile>;

// Checkout Response Metadata
export const CheckoutResponseMetadata = z.object({
  version: z.string(),
  capabilities: z.array(z.lazy(() => Response)),
}).strict();
export type CheckoutResponseMetadata = z.infer<typeof CheckoutResponseMetadata>;

// Order Response Metadata
export const OrderResponseMetadata = z.object({
  version: z.string(),
  capabilities: z.array(z.lazy(() => Response)),
}).strict();
export type OrderResponseMetadata = z.infer<typeof OrderResponseMetadata>;

// Capability (Discovery)
export const CapabilityDiscovery = z.object({
  name: z.string(),
  version: z.string(),
  spec: z.string(),
  schema: z.string(),
  extends: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
}).strict();
export type CapabilityDiscovery = z.infer<typeof CapabilityDiscovery>;

// Capability (Response)
export const CapabilityResponse = z.object({
  name: z.string(),
  version: z.string(),
  spec: z.string().optional(),
  schema: z.string().optional(),
  extends: z.string().optional(),
  config: z.record(z.string(), z.any()).optional(),
}).strict();
export type CapabilityResponse = z.infer<typeof CapabilityResponse>;

// Services (referenced in Discovery Profile; not defined as a standalone schema section on the reference page)
export const Services = z.unknown();
export type Services = z.infer<typeof Services>;

// Discovery / Response (aliases for Capability(Discovery) / Capability(Response))
export const Discovery = z.lazy(() => CapabilityDiscovery);
export type Discovery = z.infer<typeof Discovery>;
export const Response = z.lazy(() => CapabilityResponse);
export type Response = z.infer<typeof Response>;

// UCP Response metadata objects referenced by Checkout Response / Order
export const UcpResponseCheckout = z.lazy(() => CheckoutResponseMetadata);
export type UcpResponseCheckout = z.infer<typeof UcpResponseCheckout>;
export const UcpResponseOrder = z.lazy(() => OrderResponseMetadata);
export type UcpResponseOrder = z.infer<typeof UcpResponseOrder>;
