import { Result } from "@/lib";

import { Amount, Blockchain } from "@/balances/values";
import { Currency } from "@/balances/values";
import {
  PaymentTransaction,
  FeeTransaction,
  BridgeTransfer,
} from "@/payments/entities";
import {
  BlockchainPaymentActionError,
  BlockchainActionRateExceeded,
  BlockchainBridgeError,
} from "@/payments/errors";

export type DepositTestnetMoney = (params: {
  address: string;
  blockchain: Blockchain;
  live: false;
  currencies: Currency[];
}) => Promise<
  Result<void, BlockchainPaymentActionError | BlockchainActionRateExceeded>
>;

export type BlockchainTransaction = Readonly<
  | Omit<PaymentTransaction, "id" | "fingerprint" | "live" | "payment">
  | Omit<FeeTransaction, "id" | "live" | "payment">
>;

export type ListBlockchainWalletTransactions = (params: {
  wallets: Array<{
    address: string;
    blockchain: Blockchain;
    locationId: string;
  }>;
  live: boolean;
  from?: Date;
  to?: Date;
}) => Promise<Result<BlockchainTransaction[], BlockchainPaymentActionError>>;

export type ValidateBlockchainAddress = (params: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
}) => Promise<Result<{ isValid: boolean }, BlockchainPaymentActionError>>;

export type SendBlockchainTransaction = (params: {
  transaction: PaymentTransaction;
  sourceAddress: string;
  tokenAddress: string;
  destinationAddress: string;
  blockchain: Blockchain;
  live: boolean;
}) => Promise<
  Result<
    { payment: PaymentTransaction; fee?: BlockchainTransaction },
    BlockchainPaymentActionError
  >
>;

export type BridgeUSDCBetweenBlockchains = (params: {
  amount: Amount;
  from: {
    address: string;
    blockchain: Blockchain;
    locationId: string;
  };
  to: {
    address: string;
    blockchain: Blockchain;
    locationId: string;
  };
  accountId: string;
  live: boolean;
}) => Promise<Result<BridgeTransfer, BlockchainBridgeError>>;

export type RetryUSDCBridgeBetweenBlockchains = (params: {
  bridgeTransfer: BridgeTransfer;
}) => Promise<Result<BridgeTransfer, BlockchainBridgeError>>;
