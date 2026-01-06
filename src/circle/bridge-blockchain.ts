import { Blockchain as CoreBlockchain } from "@/balances/values";
import { BridgeChain } from "@circle-fin/bridge-kit";

export const chooseCircleBridgeBlockchain = ({
  blockchain,
  live,
}: {
  blockchain: CoreBlockchain;
  live: boolean;
}): BridgeChain => {
  return BRIDGE_CHAIN_MAPPING[blockchain][live ? "mainnet" : "testnet"];
};

const BRIDGE_CHAIN_MAPPING: {
  [key in CoreBlockchain]: {
    mainnet: BridgeChain;
    testnet: BridgeChain;
  };
} = {
  arc: {
    mainnet: BridgeChain.Arc_Testnet, // testnet only for now
    testnet: BridgeChain.Arc_Testnet,
  },
  polygon: {
    mainnet: BridgeChain.Polygon,
    testnet: BridgeChain.Polygon_Amoy_Testnet,
  },
  ethereum: {
    mainnet: BridgeChain.Ethereum,
    testnet: BridgeChain.Ethereum_Sepolia,
  },
  avalanche: {
    mainnet: BridgeChain.Avalanche,
    testnet: BridgeChain.Avalanche_Fuji,
  },
  solana: {
    mainnet: BridgeChain.Solana,
    testnet: BridgeChain.Solana_Devnet,
  },
  arbitrum: {
    mainnet: BridgeChain.Arbitrum,
    testnet: BridgeChain.Arbitrum_Sepolia,
  },
  unichain: {
    mainnet: BridgeChain.Unichain,
    testnet: BridgeChain.Unichain_Sepolia,
  },
  base: {
    mainnet: BridgeChain.Base,
    testnet: BridgeChain.Base_Sepolia,
  },
  optimism: {
    mainnet: BridgeChain.Optimism,
    testnet: BridgeChain.Optimism_Sepolia,
  },
} as const;
