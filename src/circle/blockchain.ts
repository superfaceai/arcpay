import { Blockchain as PaymentBlockchain } from "@/payments/values/index.js";

import {
  TestnetBlockchain as CircleTestnetBlockchain,
  Blockchain as CircleBlockchain,
} from "@circle-fin/developer-controlled-wallets";

export const chooseCircleBlockchain = ({
  blockchain,
  live,
}: {
  blockchain: PaymentBlockchain;
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

export const getCoreBlockchainFor = ({
  blockchain,
}: {
  blockchain: CircleBlockchain;
}): PaymentBlockchain => {
  const coreBlockchain = Object.keys(MAPPING).find(
    (blockchainIdentifier) =>
      MAPPING[blockchainIdentifier as PaymentBlockchain].mainnet ===
        blockchain ||
      MAPPING[blockchainIdentifier as PaymentBlockchain].testnet === blockchain
  );

  if (!coreBlockchain) {
    throw new Error(`Could not identify blockchain identifier ${blockchain}`);
  }

  return coreBlockchain as PaymentBlockchain;
};

const MAPPING: {
  [key in PaymentBlockchain]: {
    mainnet: CircleBlockchain;
    testnet: CircleTestnetBlockchain;
  };
} = {
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
};
