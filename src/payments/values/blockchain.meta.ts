import { Blockchain } from "./blockchain.js";
import { Currency } from "./currency.js";
import {
  NativeTestnetToken,
  NativeMainnetToken,
  StablecoinToken,
} from "./token.js";

type BlockchainMetadata = {
  name: string;
  nativeToken: {
    mainnet: NativeMainnetToken;
    testnet: NativeTestnetToken;
  };
  supportedStablecoins: Array<{
    token: StablecoinToken;
    mainnetAddress: string;
    testnetAddress: string;
  }>;
};

export const getStablecoinTokenAddress = ({
  blockchain,
  token,
  live,
}: {
  blockchain: Blockchain;
  token: StablecoinToken;
  live: boolean;
}): string | null => {
  const stablecoin = BLOCKCHAIN_META[blockchain].supportedStablecoins.find(
    (s) => s.token === token
  );

  if (!stablecoin) return null;

  return stablecoin[live ? "mainnetAddress" : "testnetAddress"];
};

export const isStablecoinSupported = ({
  blockchain,
  token,
}: {
  blockchain: Blockchain;
  token: StablecoinToken;
}): boolean => {
  const stablecoin = BLOCKCHAIN_META[blockchain].supportedStablecoins.find(
    (s) => s.token === token
  );

  return !!stablecoin;
};

export const getCurrenciesForBlockchain = ({
  blockchain,
}: {
  blockchain: Blockchain;
}): Currency[] => {
  const blockchainMeta = BLOCKCHAIN_META[blockchain];
  const stablecoins = blockchainMeta.supportedStablecoins.map((s) => s.token);
  const nativeToken = blockchainMeta.nativeToken.mainnet;
  return [...new Set([...stablecoins, nativeToken])];
};

export const isCurrencySupported = ({
  blockchain,
  currency,
}: {
  blockchain: Blockchain;
  currency: Currency;
}): boolean => {
  return getCurrenciesForBlockchain({ blockchain }).includes(currency);
};

export const getNativeTokenFor = ({
  blockchain,
}: {
  blockchain: Blockchain;
}): NativeMainnetToken => {
  return BLOCKCHAIN_META[blockchain].nativeToken.mainnet;
};

const BLOCKCHAIN_META: { [key in Blockchain]: BlockchainMetadata } = {
  arc: {
    name: "Arc",
    nativeToken: {
      mainnet: "USDC", // testnet only for now
      testnet: "USDC-TESTNET",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0x3600000000000000000000000000000000000000", // testnet only for now
        testnetAddress: "0x3600000000000000000000000000000000000000",
      },
      {
        token: "EURC",
        mainnetAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // testnet only for now
        testnetAddress: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
      },
    ],
  },
  polygon: {
    name: "Polygon",
    nativeToken: {
      mainnet: "POL",
      testnet: "POL-AMOY",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        testnetAddress: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
      },
    ],
  },
  ethereum: {
    name: "Ethereum",
    nativeToken: {
      mainnet: "ETH",
      testnet: "ETH-SEPOLIA",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        testnetAddress: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      },
      {
        token: "EURC",
        mainnetAddress: "0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c",
        testnetAddress: "0xa683d909e996052955500ddc45ca13e25c76e286",
      },
    ],
  },
  avalanche: {
    name: "Avalanche",
    nativeToken: {
      mainnet: "AVAX",
      testnet: "AVAX-FUJI",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
        testnetAddress: "0x5425890298aed601595a70AB815c96711a31Bc65",
      },
      {
        token: "EURC",
        mainnetAddress: "0xc891eb4cbdeff6e073e859e987815ed1505c2acd",
        testnetAddress: "0x5e44db7996c682e92a960b65ac713a54ad815c6b",
      },
    ],
  },
  solana: {
    name: "Solana",
    nativeToken: {
      mainnet: "SOL",
      testnet: "SOL-DEVNET",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        testnetAddress: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
      },
      {
        token: "EURC",
        mainnetAddress: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
        testnetAddress: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
      },
    ],
  },
  arbitrum: {
    name: "Arbitrum",
    nativeToken: {
      mainnet: "ETH",
      testnet: "ETH-SEPOLIA",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        testnetAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
      },
    ],
  },
  unichain: {
    name: "Unichain",
    nativeToken: {
      mainnet: "ETH",
      testnet: "ETH-SEPOLIA",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
        testnetAddress: "0x31d0220469e10c4E71834a79b1f276d740d3768F",
      },
    ],
  },
  base: {
    name: "Base",
    nativeToken: {
      mainnet: "ETH",
      testnet: "ETH-SEPOLIA",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        testnetAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      },
      {
        token: "EURC",
        mainnetAddress: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42",
        testnetAddress: "0x808456652fdb597867f38412077A9182bf77359F",
      },
    ],
  },
  optimism: {
    name: "Optimism",
    nativeToken: {
      mainnet: "ETH",
      testnet: "ETH-SEPOLIA",
    },
    supportedStablecoins: [
      {
        token: "USDC",
        mainnetAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        testnetAddress: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      },
    ],
  },
};
