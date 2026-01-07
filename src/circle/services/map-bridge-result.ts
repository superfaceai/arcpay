import { BridgeResult } from "@circle-fin/bridge-kit";

import { withBigIntSerialization } from "@/lib/bigint";
import {
  Amount,
  getNativeTokenFor,
  mapAmount,
  tokenToCurrency,
} from "@/balances/values";
import { Blockchain } from "@/balances/values";
import {
  BridgeTransfer,
  bridgeTransferId,
  FeeTransaction,
  ReconciliationTransaction,
  transactionId,
} from "@/payments/entities";
import { calculateFee } from "./calculate-fee";

type BridgeMapping = {
  bridge: BridgeTransfer;
  approval?: { fee: FeeTransaction };
  burn?: { tx: ReconciliationTransaction; fee: FeeTransaction };
  mint?: { tx: ReconciliationTransaction; fee: FeeTransaction };
};

type StepTxData = { gasUsed?: bigint; effectiveGasPrice?: bigint };

export const mapBridgeResult = ({
  amount,
  from,
  to,
  accountId,
  live,
  result,
}: {
  amount: Amount;
  from: {
    address: string;
    blockchain: Blockchain;
    locationId: string;
  };
  to: {
    address: string;
    blockchain: Blockchain;
    locationId: string;
  };
  accountId: string;
  live: boolean;
  result: BridgeResult;
}): BridgeMapping => {
  const status = mapBridgeStatus(result.state);

  const startDate = new Date();
  const approvalDate = new Date(startDate.getTime() + 1);
  const burnDate = new Date(startDate.getTime() + 2);
  const mintDate = new Date(startDate.getTime() + 3);

  const bridge = BridgeTransfer.parse({
    id: bridgeTransferId(),
    live,
    account: accountId,
    amount: amount.toString(),
    currency: "USDC",
    from_location: from.locationId,
    to_location: to.locationId,
    status,
    created_at: startDate,
    ...(status === "succeeded" ? { finished_at: startDate } : {}),
    raw: withBigIntSerialization(result),
  });

  const approvalSteps = result.steps.filter((step) => step.name === "approve");
  const burnSteps = result.steps.filter((step) => step.name === "burn");
  const mintSteps = result.steps.filter((step) => step.name === "mint");

  const approvalStep = approvalSteps.findLast(
    (step) => step.state === "success"
  );
  const burnStep = burnSteps.findLast((step) => step.state === "success");
  const mintStep = mintSteps.findLast((step) => step.state === "success");

  const sourceChainDecimals = result.source.chain.nativeCurrency.decimals;
  const targetChainDecimals = result.destination.chain.nativeCurrency.decimals;

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

  const approval: BridgeMapping["approval"] = approvalStep
    ? {
        fee: {
          id: transactionId(),
          live,
          status: "completed",
          amount: mapAmount(approvalFeeAmount, { negative: true }),
          currency: tokenToCurrency(
            getNativeTokenFor({ blockchain: from.blockchain })
          ),
          location: from.locationId,
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

  const burn: BridgeMapping["burn"] = burnStep
    ? {
        tx: {
          id: transactionId(),
          live,
          status: "completed",
          amount: mapAmount(amount, { negative: true }),
          currency: "USDC",
          type: "reconciliation",
          location: from.locationId,
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
          live,
          status: "completed",
          amount: mapAmount(burnFeeAmount, { negative: true }),
          currency: tokenToCurrency(
            getNativeTokenFor({ blockchain: from.blockchain })
          ),
          location: from.locationId,
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

  const mint: BridgeMapping["mint"] = mintStep
    ? {
        tx: {
          id: transactionId(),
          live,
          status: "completed",
          amount: mapAmount(amount, { negative: false }),
          currency: "USDC",
          type: "reconciliation",
          location: to.locationId,
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
          live,
          status: "completed",
          amount: mapAmount(mintFeeAmount, { negative: true }),
          currency: tokenToCurrency(
            getNativeTokenFor({ blockchain: to.blockchain })
          ),
          location: to.locationId,
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
    bridge,
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
