import { Blockchain } from "./values/blockchain.js";
import { Amount } from "./values/amount.js";
import { Currency } from "./values/currency.js";
import { Token } from "./values/token.js";

export interface BlockchainActionError {
  readonly type: "BlockchainActionError";
  readonly message: string;
  readonly blockchain?: Blockchain;
}

export interface BlockchainActionRateExceeded {
  readonly type: "BlockchainActionRateExceeded";
  readonly message: string;
  readonly blockchain: Blockchain;
}

export interface UnsupportedBlockchainError {
  readonly type: "UnsupportedBlockchainError";
  readonly currency: Currency;
  readonly blockchains: Blockchain[];
}

export interface PaymentLiveModeError {
  readonly type: "PaymentLiveModeError";
  readonly message: string;
}

export interface PaymentUnsupportedTokenError {
  readonly type: "PaymentUnsupportedTokenError";
  readonly token: Token;
  readonly blockchain: Blockchain;
}

export interface PaymentInsufficientBalanceError {
  readonly type: "PaymentInsufficientBalanceError";
  readonly currency: Currency;
  readonly requiredAmount: Amount;
  readonly availableAmount: Amount;
}

export interface PaymentInvalidAddressError {
  readonly type: "PaymentInvalidAddressError";
  readonly address: string;
  readonly blockchain: Blockchain;
}
