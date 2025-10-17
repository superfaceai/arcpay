export interface CircleCreateWalletError {
  readonly type: "CircleCreateWalletError";
  readonly message: string;
}

export interface CircleTestnetFaucetError {
  readonly type: "CircleTestnetFaucetError";
  readonly message: string;
}

export interface CircleTooManyRequestsError {
  readonly type: "CircleTooManyRequestsError";
}

export interface CircleFetchBalanceError {
  readonly type: "CircleFetchBalanceError";
  readonly message: string;
}

export interface CircleFetchTransactionsError {
  readonly type: "CircleFetchTransactionsError";
  readonly message: string;
}

export interface CircleValidateAddressError {
  readonly type: "CircleValidateAddressError";
  readonly message: string;
}

export interface CircleEstimateFeesError {
  readonly type: "CircleEstimateFeesError";
  readonly message: string;
}

export interface CircleCreateTransactionError {
  readonly type: "CircleCreateTransactionError";
  readonly message: string;
}

export interface CircleLookupTokenError {
  readonly type: "CircleLookupTokenError";
  readonly message: string;
}