import { createWalletClient, http, defineChain, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { err, ok, Result } from "@/lib";

import { Amount } from "@/balances/values";
import { ArcChainError } from "../errors";

const RPC_URL = "https://rpc.testnet.arc.network";
const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
});

export const sendTransactionOnArcTestnet = async ({
  fromWalletPrivateKey,
  toAddress,
  amount,
}: {
  fromWalletPrivateKey: string;
  toAddress: string;
  amount: Amount;
}): Promise<Result<{ txHash: string }, ArcChainError>> => {
  try {
    const account = privateKeyToAccount(fromWalletPrivateKey as `0x${string}`);

    const client = createWalletClient({
      account,
      chain: arcTestnet,
      transport: http(RPC_URL),
    });

    const txHash = await client.sendTransaction({
      to: toAddress as `0x${string}`,
      value: parseEther(amount),
    });

    return ok({ txHash });
  } catch (error) {
    return err({
      type: "ArcChainError",
      message: `Failed to send transaction on Arc Testnet: ${String(error)}`,
    });
  }
};
