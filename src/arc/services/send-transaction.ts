import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { err, ok, Result } from "@/lib";

import { Amount } from "@/balances/values";
import { arcTestnet } from "../chain";
import { ArcChainError } from "../errors";

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
      transport: http(arcTestnet.rpcUrls.default.http[0]),
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
