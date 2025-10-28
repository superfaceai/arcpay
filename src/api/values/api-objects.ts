import { ApiKey, Account } from "@/identity/entities";
import { Location } from "@/balances/entities";
import { Balance } from "@/balances/entities";
import { Deposit } from "@/payments/entities";
import { Payment } from "@/payments/entities";
import { Transaction } from "@/payments/entities";

// When adding new API object,
// 1) Add the object name to the ObjectName type
// 2) Add the object type to the ExpectedObject type

export type ObjectName =
  | "account"
  | "apikey"
  | "balance"
  | "deposit"
  | "location"
  | "payment"
  | "transaction";

export type ExpectedObject<Name extends ObjectName> = Name extends "apikey"
  ? ApiKey
  : Name extends "account"
  ? Account
  : Name extends "location"
  ? Location
  : Name extends "balance"
  ? Balance
  : Name extends "deposit"
  ? Deposit
  : Name extends "payment"
  ? Payment
  : Name extends "transaction"
  ? Transaction
  : never;
