import { Result } from "@/lib";

import { LocationAsset } from "@/balances/entities";
import { Blockchain } from "@/balances/values";
import { BlockchainWalletActionError } from "@/balances/errors";

export type CreateBlockchainWallet = (params: {
  blockchain: Blockchain;
  live: boolean;
}) => Promise<Result<{ address: string }, BlockchainWalletActionError>>;

export type GetBlockchainWalletBalance = (params: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
}) => Promise<Result<Array<LocationAsset>, BlockchainWalletActionError>>;
