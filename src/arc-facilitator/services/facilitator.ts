import Config from "@/config";
import { x402Facilitator } from "@x402/core/facilitator";
import type {
  PaymentPayload,
  PaymentRequirements,
  SettleResponse,
  VerifyResponse,
} from "@x402/core/types";
import { toFacilitatorEvmSigner } from "@x402/evm";
import { ExactEvmScheme } from "@x402/evm/exact/facilitator";
import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { arcTestnet } from "@/arc/chain";

// TODO: Update for mainnet when available

const evmAccount = privateKeyToAccount(
  Config.ARC_FACILITATOR_WALLET_PRIVATE_KEY,
);

const viemClient = createWalletClient({
  account: evmAccount,
  chain: arcTestnet,
  transport: http(arcTestnet.rpcUrls.default.http[0]),
}).extend(publicActions);

const evmSigner = toFacilitatorEvmSigner({
  getCode: (args: { address: `0x${string}` }) => viemClient.getCode(args),
  address: evmAccount.address,
  readContract: (args: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
  }) =>
    viemClient.readContract({
      ...args,
      args: args.args || [],
    }),
  verifyTypedData: (args: {
    address: `0x${string}`;
    domain: Record<string, unknown>;
    types: Record<string, unknown>;
    primaryType: string;
    message: Record<string, unknown>;
    signature: `0x${string}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) => viemClient.verifyTypedData(args as any),
  writeContract: (args: {
    address: `0x${string}`;
    abi: readonly unknown[];
    functionName: string;
    args: readonly unknown[];
  }) =>
    viemClient.writeContract({
      ...args,
      args: args.args || [],
    }),
  sendTransaction: (args: { to: `0x${string}`; data: `0x${string}` }) =>
    viemClient.sendTransaction(args),
  waitForTransactionReceipt: (args: { hash: `0x${string}` }) =>
    viemClient.waitForTransactionReceipt(args),
});

const facilitator = new x402Facilitator()
  .onBeforeVerify(async (context) => {
    console.log("[arc-facilitator] Before verify", context);
  })
  .onAfterVerify(async (context) => {
    console.log("[arc-facilitator] After verify", context);
  })
  .onVerifyFailure(async (context) => {
    console.log("[arc-facilitator] Verify failure", context);
  })
  .onBeforeSettle(async (context) => {
    console.log("[arc-facilitator] Before settle", context);
  })
  .onAfterSettle(async (context) => {
    console.log("[arc-facilitator] After settle", context);
  })
  .onSettleFailure(async (context) => {
    console.log("[arc-facilitator] Settle failure", context);
  });

const scheme = new ExactEvmScheme(evmSigner, {
  deployERC4337WithEIP6492: true,
});

// Register only x402 v2 exact scheme for arc-testnet
facilitator.register("eip155:5042002", scheme);

console.info(`[arc-facilitator] EVM account: ${evmAccount.address}`);

export const verify = async (
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
): Promise<VerifyResponse> => {
  return facilitator.verify(paymentPayload, paymentRequirements);
};

export const settle = async (
  paymentPayload: PaymentPayload,
  paymentRequirements: PaymentRequirements,
): Promise<SettleResponse> => {
  return facilitator.settle(paymentPayload, paymentRequirements);
};

export const getSupported = () => {
  return facilitator.getSupported();
};
