import { Amount, Blockchain, Currency, Token } from "@/balances/values";
import { PaymentMandate } from "./entities";

export interface BlockchainPaymentActionError {
  readonly type: "BlockchainPaymentActionError";
  readonly message: string;
  readonly blockchain?: Blockchain;
}

export interface BlockchainBridgeError {
  readonly type: "BlockchainBridgeError";
  readonly message: string;
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
  readonly reason:
    | "no_balance"
    | "not_in_single_location"
    | "not_in_preferred_network";
}

export interface PaymentInvalidCryptoAddressError {
  readonly type: "PaymentInvalidCryptoAddressError";
  readonly address: string;
  readonly blockchain: Blockchain;
}

export interface PaymentInvalidAccountError {
  readonly type: "PaymentInvalidAccountError";
  readonly invalidReason: "not_found" | "self";
  readonly handle?: string;
}

export interface PaymentUnsupportedPaymentMethodError {
  readonly type: "PaymentUnsupportedPaymentMethodError";
  readonly method: string;
}

export interface PaymentUnsupportedCurrencyError {
  readonly type: "PaymentUnsupportedCurrencyError";
  readonly currency: string;
}

export interface PaymentMandateExpiredError {
  readonly type: "PaymentMandateExpiredError";
  readonly expiredAt: Date;
}

export interface PaymentMandateInactiveError {
  readonly type: "PaymentMandateInactiveError";
  readonly inactiveReason: PaymentMandate["inactive_reason"];
}

export interface PaymentMandateNotFoundError {
  readonly type: "PaymentMandateNotFoundError";
}

export interface PaymentMandateMismatchError {
  readonly type: "PaymentMandateMismatchError";
  readonly mandateGiven: {
    currency: Currency;
    amount: Amount;
  };
  readonly captureRequired: {
    currency: Currency;
    amount: Amount;
  };
}

export interface PaymentCaptureError {
  readonly type: "PaymentCaptureError";
}

export interface InitialFundingNotAllowed {
  readonly type: "InitialFundingNotAllowed";
  readonly reason: "disabled" | "quota_exceeded";
}

export interface BridgeTransferLocationError {
  readonly type: "BridgeTransferLocationError";
  readonly reason: "not_found" | "unsupported";
  readonly locationId: string;
}

export interface BridgeTransferCurrencyError {
  readonly type: "BridgeTransferCurrencyError";
  readonly reason: "not_supported";
  readonly currency: Currency;
}
