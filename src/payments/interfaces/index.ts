import { Result } from "@/lib";

import { Blockchain, Currency } from "@/payments/values";
import {
  LocationAsset,
  PaymentTransaction,
  FeeTransaction,
} from "@/payments/entities";
import {
  BlockchainActionError,
  BlockchainActionRateExceeded,
} from "@/payments/errors";

export type CreateBlockchainWallet = (params: {
  blockchain: Blockchain;
  live: boolean;
}) => Promise<Result<{ address: string }, BlockchainActionError>>;

export type DepositTestnetMoney = (params: {
  address: string;
  blockchain: Blockchain;
  live: false;
  currencies: Currency[];
}) => Promise<
  Result<void, BlockchainActionError | BlockchainActionRateExceeded>
>;

export type GetBlockchainWalletBalance = (params: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
}) => Promise<Result<Array<LocationAsset>, BlockchainActionError>>;

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
}) => Promise<Result<BlockchainTransaction[], BlockchainActionError>>;

export type ValidateBlockchainAddress = (params: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
}) => Promise<Result<{ isValid: boolean }, BlockchainActionError>>;

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
    BlockchainActionError
  >
>;
