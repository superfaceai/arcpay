import { defineChain } from "viem";

export const RPC_URL = "https://rpc.testnet.arc.network";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "ARC Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "ARC",
    symbol: "ARC",
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "ARC Explorer",
      url: RPC_URL,
    },
  },
  testnet: true,
});
