import { ApiKey, User } from "@/identity/entities";
import { Deposit, Transaction, Wallet } from "@/payments/entities";
import { Balance as BalanceValue } from "@/payments/values";
import { Balance as BalanceEntity } from "@/payments/entities";

// When adding new API object,
// 1) Add the object name to the ObjectName type
// 2) Add the object type to the ExpectedObject type

export type ObjectName =
  | "apikey"
  | "balance"
  | "user"
  | "wallet"
  | "deposit"
  | "transaction";

export type ExpectedObject<Name extends ObjectName> = Name extends "apikey"
  ? ApiKey
  : Name extends "user"
  ? User
  : Name extends "wallet"
  ? Wallet
  : Name extends "balance"
  ? BalanceValue | BalanceEntity
  : Name extends "deposit"
  ? Deposit
  : Name extends "transaction"
  ? Transaction
  : never;
