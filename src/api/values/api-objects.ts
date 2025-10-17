import { ApiKey, User } from "@/identity/entities/index.js";
import { Deposit, Transaction, Wallet } from "@/payments/entities/index.js";
import { Balance } from "@/payments/values/index.js";

// When adding new API object,
// 1) Add the object name to the ObjectName type
// 2) Add the object type to the ExpectedObject type

export type ObjectName =
  | "apikey"
  | "user"
  | "wallet"
  | "balance"
  | "deposit"
  | "transaction";

export type ExpectedObject<Name extends ObjectName> = Name extends "apikey"
  ? ApiKey
  : Name extends "user"
  ? User
  : Name extends "wallet"
  ? Wallet
  : Name extends "balance"
  ? Balance
  : Name extends "deposit"
  ? Deposit
  : Name extends "transaction"
  ? Transaction
  : never;
