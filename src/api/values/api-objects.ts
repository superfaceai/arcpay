import { ApiKey, Account, Contact } from "@/identity/entities";
import { Location } from "@/balances/entities";
import { Balance } from "@/balances/entities";
import {
  Deposit,
  PaymentMandate,
  PaymentCapture,
  BridgeTransfer,
} from "@/payments/entities";
import { Payment } from "@/payments/entities";
import { Transaction } from "@/payments/entities";
import { NotificationRule, Notification } from "@/notifications/entities";

// When adding new API object,
// 1) Add the object name to the ObjectName type
// 2) Add the object type to the ExpectedObject type

export type ObjectName =
  | "account"
  | "contact"
  | "apikey"
  | "balance"
  | "deposit"
  | "location"
  | "payment"
  | "payment_mandate"
  | "payment_capture"
  | "transaction"
  | "notification_rule"
  | "notification"
  | "bridge_transfer";

export type ExpectedObject<Name extends ObjectName> = Name extends "apikey"
  ? ApiKey
  : Name extends "account"
  ? Account
  : Name extends "contact"
  ? Contact
  : Name extends "location"
  ? Location
  : Name extends "balance"
  ? Balance
  : Name extends "deposit"
  ? Deposit
  : Name extends "payment"
  ? Payment
  : Name extends "payment_mandate"
  ? PaymentMandate
  : Name extends "payment_capture"
  ? PaymentCapture
  : Name extends "transaction"
  ? Transaction
  : Name extends "notification_rule"
  ? NotificationRule
  : Name extends "notification"
  ? Notification
  : Name extends "bridge_transfer"
  ? BridgeTransfer
  : never;
