import { Blockchain as CoreBlockchain } from "@/balances/values";

import {
  TestnetBlockchain as CircleTestnetBlockchain,
  Blockchain as CircleBlockchain,
} from "@circle-fin/developer-controlled-wallets";

export const chooseCircleBlockchain = ({
  blockchain,
  live,
}: {
  blockchain: CoreBlockchain;
  live: boolean;
}): CircleBlockchain => {
  return MAPPING[blockchain][live ? "mainnet" : "testnet"];
};

export const getCircleBlockchainExplorerUrl = ({
  txHash,
  blockchain,
}: {
  txHash?: string;
  blockchain: CircleBlockchain;
}): string | undefined => {
  if (!txHash) return undefined;

  const explorerUrl = BLOCKCHAIN_EXPLORER_URL[blockchain];
  if (!explorerUrl) return undefined;

  return explorerUrl + txHash;
};

export const mapCircleBlockchain = (
  blockchain: CircleBlockchain
): CoreBlockchain => {
  const coreBlockchain = Object.keys(MAPPING).find(
    (blockchainIdentifier) =>
      MAPPING[blockchainIdentifier as CoreBlockchain].mainnet === blockchain ||
      MAPPING[blockchainIdentifier as CoreBlockchain].testnet === blockchain
  );

  if (!coreBlockchain) {
    throw new Error(`Could not identify blockchain identifier ${blockchain}`);
  }

  return coreBlockchain as CoreBlockchain;
};

const MAPPING: {
  [key in CoreBlockchain]: {
    mainnet: CircleBlockchain;
    testnet: CircleTestnetBlockchain;
  };
} = {
  arc: {
    mainnet: "ARC-TESTNET", // testnet only for now
    testnet: "ARC-TESTNET",
  },
  polygon: {
    mainnet: "MATIC",
    testnet: "MATIC-AMOY",
  },
  ethereum: {
    mainnet: "ETH",
    testnet: "ETH-SEPOLIA",
  },
  avalanche: {
    mainnet: "AVAX",
    testnet: "AVAX-FUJI",
  },
  solana: {
    mainnet: "SOL",
    testnet: "SOL-DEVNET",
  },
  arbitrum: {
    mainnet: "ARB",
    testnet: "ARB-SEPOLIA",
  },
  unichain: {
    mainnet: "UNI",
    testnet: "UNI-SEPOLIA",
  },
  base: {
    mainnet: "BASE",
    testnet: "BASE-SEPOLIA",
  },
  optimism: {
    mainnet: "OP",
    testnet: "OP-SEPOLIA",
  },
} as const;

const BLOCKCHAIN_EXPLORER_URL: Record<CircleBlockchain, string | null> = {
  "ARC-TESTNET": "https://testnet.arcscan.app/tx/",
  MATIC: "https://polygonscan.com/tx/",
  "MATIC-AMOY": "https://amoy.polygonscan.com/tx/",
  ETH: "https://etherscan.io/tx/",
  "ETH-SEPOLIA": "https://sepolia.etherscan.io/tx/",
  AVAX: "https://snowtrace.io/tx/",
  "AVAX-FUJI": "https://testnet.snowtrace.io/tx/",
  SOL: "https://solscan.io/tx/",
  "SOL-DEVNET": "https://explorer.solana.com/tx/",
  ARB: "https://arbiscan.io/tx/",
  "ARB-SEPOLIA": "https://sepolia.arbiscan.io/tx/",
  UNI: "https://uniswap.org/tx/",
  "UNI-SEPOLIA": "https://sepolia.uniswap.org/tx/",
  BASE: "https://basescan.org/tx/",
  "BASE-SEPOLIA": "https://sepolia.basescan.org/tx/",
  OP: "https://optimistic.etherscan.io/tx/",
  "OP-SEPOLIA": "https://sepolia-optimism.etherscan.io/tx/",
  NEAR: null,
  "NEAR-TESTNET": null,
  EVM: null,
  "EVM-TESTNET": null,
  APTOS: null,
  "APTOS-TESTNET": null,
  MONAD: null,
  "MONAD-TESTNET": null,
};
