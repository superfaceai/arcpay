import { Blockchain, Currency } from "@/balances/values";

export interface BlockchainWalletActionError {
  readonly type: "BlockchainWalletActionError";
  readonly message: string;
  readonly blockchain?: Blockchain;
}

export interface UnsupportedBlockchainError {
  readonly type: "UnsupportedBlockchainError";
  readonly currency: Currency;
  readonly blockchains: Blockchain[];
}
