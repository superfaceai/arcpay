import { BridgeResult } from "@circle-fin/bridge-kit";

import { withBigIntSerialization } from "@/lib/bigint";
import {
  Amount,
  getNativeTokenFor,
  mapAmount,
  tokenToCurrency,
} from "@/balances/values";
import {
  BridgeTransfer,
  bridgeTransferId,
  FeeTransaction,
  ReconciliationTransaction,
  transactionId,
} from "@/payments/entities";
import { calculateFee } from "./calculate-fee";
import { mapBridgeChainToCoreBlockchain } from "../bridge-blockchain";

type BridgeTransactions = {
  approval?: { fee: FeeTransaction };
  burn?: { tx: ReconciliationTransaction; fee: FeeTransaction };
  mint?: { tx: ReconciliationTransaction; fee: FeeTransaction };
};

type StepTxData = { gasUsed?: bigint; effectiveGasPrice?: bigint };

export const mapBridgeResult = ({
  previousBridgeTransfer,
  amount,
  from,
  to,
  accountId,
  live,
  raw,
}: {
  previousBridgeTransfer?: BridgeTransfer;
  amount: Amount;
  from: { locationId: string };
  to: { locationId: string };
  accountId: string;
  live: boolean;
  raw: BridgeResult;
}): BridgeTransfer => {
  const status = mapBridgeStatus(raw.state);

  const now = new Date();

  const bridge = BridgeTransfer.parse({
    id: previousBridgeTransfer?.id ?? bridgeTransferId(),
    live,
    account: accountId,
    amount: amount.toString(),
    currency: "USDC",
    from_location: from.locationId,
    to_location: to.locationId,
    status,
    created_at: previousBridgeTransfer?.created_at ?? now,
    ...(status === "succeeded"
      ? { finished_at: previousBridgeTransfer?.finished_at ?? now }
      : {}),
    raw: withBigIntSerialization(raw),
  });

  return bridge;
};

export const mapBridgeResultTransactions = ({
  bridge,
  raw,
  previousRaw,
}: {
  bridge: BridgeTransfer;
  raw: BridgeResult;
  previousRaw?: BridgeResult;
}): BridgeTransactions => {
  const now = new Date();
  const approvalDate = new Date(now.getTime() + 1);
  const burnDate = new Date(now.getTime() + 2);
  const mintDate = new Date(now.getTime() + 3);

  const {
    approvalStep: previousApprovalStep,
    burnStep: previousBurnStep,
    mintStep: previousMintStep,
  } = breakoutSteps(previousRaw);

  const { approvalStep, burnStep, mintStep } = breakoutSteps(raw);

  const sourceBlockchain =
    mapBridgeChainToCoreBlockchain(raw.source.chain.chain) ||
    mapBridgeChainToCoreBlockchain(raw.source.chain.name);

  const targetBlockchain =
    mapBridgeChainToCoreBlockchain(raw.destination.chain.chain) ||
    mapBridgeChainToCoreBlockchain(raw.destination.chain.name);

  if (!sourceBlockchain || !targetBlockchain) {
    throw new Error(
      `Could not identify source or target blockchain ${raw.source.chain.chain} or ${raw.source.chain.name} or ${raw.destination.chain.chain} or ${raw.destination.chain.name}`
    );
  }

  const sourceChainDecimals = raw.source.chain.nativeCurrency.decimals;
  const targetChainDecimals = raw.destination.chain.nativeCurrency.decimals;

  const approvalFeeAmount = approvalStep
    ? calculateFee({
        gasAmount: (approvalStep?.data as StepTxData)?.gasUsed ?? "0",
        gasPrice: (approvalStep?.data as StepTxData)?.effectiveGasPrice ?? "0",
        decimals: sourceChainDecimals,
      })
    : "0";
  const burnFeeAmount = burnStep
    ? calculateFee({
        gasAmount: (burnStep?.data as StepTxData)?.gasUsed ?? "0",
        gasPrice: (burnStep?.data as StepTxData)?.effectiveGasPrice ?? "0",
        decimals: sourceChainDecimals,
      })
    : "0";
  const mintFeeAmount = mintStep
    ? calculateFee({
        gasAmount: (mintStep?.data as StepTxData)?.gasUsed ?? "0",
        gasPrice: (mintStep?.data as StepTxData)?.effectiveGasPrice ?? "0",
        decimals: targetChainDecimals,
      })
    : "0";

  const approval: BridgeTransactions["approval"] =
    approvalStep && !previousApprovalStep
      ? {
          fee: {
            id: transactionId(),
            live: bridge.live,
            status: "completed",
            amount: mapAmount(approvalFeeAmount, { negative: true }),
            currency: tokenToCurrency(
              getNativeTokenFor({ blockchain: sourceBlockchain })
            ),
            location: bridge.from_location,
            type: "fee",
            purpose: "bridge_approval",
            bridge: bridge.id,
            fee_type: "network",
            network: "blockchain",
            blockchain: {
              hash: approvalStep.txHash ?? "n/a",
              explorer_url: approvalStep.explorerUrl,
            },
            created_at: approvalDate,
            finished_at: approvalDate,
          },
        }
      : undefined;

  const burn: BridgeTransactions["burn"] =
    burnStep && !previousBurnStep
      ? {
          tx: {
            id: transactionId(),
            live: bridge.live,
            status: "completed",
            amount: mapAmount(bridge.amount, { negative: true }),
            currency: "USDC",
            type: "reconciliation",
            location: bridge.from_location,
            bridge: bridge.id,
            network: "blockchain",
            blockchain: {
              hash: burnStep.txHash ?? "n/a",
              explorer_url: burnStep.explorerUrl,
            },
            created_at: burnDate,
            finished_at: burnDate,
          },
          fee: {
            id: transactionId(),
            live: bridge.live,
            status: "completed",
            amount: mapAmount(burnFeeAmount, { negative: true }),
            currency: tokenToCurrency(
              getNativeTokenFor({ blockchain: sourceBlockchain })
            ),
            location: bridge.from_location,
            type: "fee",
            purpose: "burn",
            bridge: bridge.id,
            network: "blockchain",
            fee_type: "network",
            blockchain: {
              hash: burnStep.txHash ?? "n/a",
              explorer_url: burnStep.explorerUrl,
            },
            created_at: burnDate,
            finished_at: burnDate,
          },
        }
      : undefined;

  const mint: BridgeTransactions["mint"] =
    mintStep && !previousMintStep
      ? {
          tx: {
            id: transactionId(),
            live: bridge.live,
            status: "completed",
            amount: mapAmount(bridge.amount, { negative: false }),
            currency: "USDC",
            type: "reconciliation",
            location: bridge.to_location,
            bridge: bridge.id,
            network: "blockchain",
            blockchain: {
              hash: mintStep.txHash ?? "n/a",
              explorer_url: mintStep.explorerUrl,
            },
            created_at: mintDate,
            finished_at: mintDate,
          },
          fee: {
            id: transactionId(),
            live: bridge.live,
            status: "completed",
            amount: mapAmount(mintFeeAmount, { negative: true }),
            currency: tokenToCurrency(
              getNativeTokenFor({ blockchain: targetBlockchain })
            ),
            location: bridge.to_location,
            type: "fee",
            purpose: "mint",
            bridge: bridge.id,
            network: "blockchain",
            fee_type: "network",
            blockchain: {
              hash: mintStep.txHash ?? "n/a",
              explorer_url: mintStep.explorerUrl,
            },
            created_at: mintDate,
            finished_at: mintDate,
          },
        }
      : undefined;

  return {
    approval,
    burn,
    mint,
  };
};

export const mapBridgeStatus = (
  status: BridgeResult["state"]
): BridgeTransfer["status"] => {
  if (status === "pending") return "retrying";
  if (status === "success") return "succeeded";
  if (status === "error") return "failed";
  throw new Error(`Unknown status: ${status}`);
};

const breakoutSteps = (
  raw?: BridgeResult
): {
  approvalStep: BridgeResult["steps"][number] | undefined;
  burnStep: BridgeResult["steps"][number] | undefined;
  mintStep: BridgeResult["steps"][number] | undefined;
} => {
  if (!raw)
    return {
      approvalStep: undefined,
      burnStep: undefined,
      mintStep: undefined,
    };

  const approvalSteps = raw.steps.filter((step) => step.name === "approve");
  const burnSteps = raw.steps.filter((step) => step.name === "burn");
  const mintSteps = raw.steps.filter((step) => step.name === "mint");

  const approvalStep = approvalSteps.findLast(
    (step) => step.state === "success"
  );
  const burnStep = burnSteps.findLast((step) => step.state === "success");
  const mintStep = mintSteps.findLast((step) => step.state === "success");

  return {
    approvalStep,
    burnStep,
    mintStep,
  };
};
