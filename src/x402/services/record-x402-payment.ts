import Big from "big.js";

import { err, ok, Result } from "@/lib";
import { ensureLocation } from "@/balances/services";
import {
  mapAmount,
  StablecoinToken,
  getStablecoinTokenAddress,
} from "@/balances/values";
import {
  Payment,
  PaymentCapture,
  paymentCaptureId,
  paymentId,
  PaymentMandate,
  PaymentTransaction,
  transactionId,
} from "@/payments/entities";
import { PaymentMetadata } from "@/payments/values";
import { savePaymentsWithTransactionsAndCaptures } from "@/payments/repositories";
import { getPaymentMandate } from "@/payments/services";
import { useValidPaymentMandate } from "@/payments/services/use-payment-mandate";
import type { PaymentPayload, SettleResponse } from "@x402/core/types";
import { loadLocationByAddress } from "@/balances/entities";

type RecordX402PaymentError = {
  type: "X402PaymentRecordError";
  message: string;
};

type RecordX402PaymentResult = {
  payment: Payment;
  transaction: PaymentTransaction;
  mandate?: PaymentMandate;
  capture?: PaymentCapture;
};

const ARC_NETWORK = "eip155:5042002";
const ARC_BLOCKCHAIN = "arc";
const STABLECOIN_DECIMALS = 6;

const resolveStablecoin = ({
  asset,
  live,
}: {
  asset: string;
  live: boolean;
}): StablecoinToken | null => {
  const normalizedAsset = asset.trim().toLowerCase();
  const stablecoins: StablecoinToken[] = ["USDC", "EURC"];

  for (const stablecoin of stablecoins) {
    if (stablecoin.toLowerCase() === normalizedAsset) {
      return stablecoin;
    }

    const tokenAddress = getStablecoinTokenAddress({
      blockchain: ARC_BLOCKCHAIN,
      token: stablecoin,
      live,
    });

    if (tokenAddress?.toLowerCase() === normalizedAsset) {
      return stablecoin;
    }
  }

  return null;
};

const mapX402Amount = ({
  amount,
  negative,
}: {
  amount: string | undefined;
  negative: boolean;
}) => {
  if (!amount) return "0";

  // x402 exact EVM amount is token base units, convert to decimal token units.
  const normalized = Big(amount).div(Big(10).pow(STABLECOIN_DECIMALS));
  return mapAmount(normalized.toString(), { negative });
};

export const recordX402Payment = async ({
  accountId,
  live,
  paymentPayload,
  settlement,
  mandateSecret,
}: {
  accountId: string;
  live: boolean;
  paymentPayload: PaymentPayload;
  settlement: SettleResponse;
  mandateSecret?: string;
}): Promise<Result<RecordX402PaymentResult, RecordX402PaymentError>> => {
  if (!settlement.success) {
    return err({
      type: "X402PaymentRecordError",
      message: settlement.errorReason ?? "x402 settlement failed",
    });
  }

  const { accepted, resource } = paymentPayload;

  if (accepted.network !== ARC_NETWORK) {
    return err({
      type: "X402PaymentRecordError",
      message: `Unsupported x402 network: ${accepted.network}`,
    });
  }

  const currency = resolveStablecoin({ asset: accepted.asset, live });

  if (!currency) {
    return err({
      type: "X402PaymentRecordError",
      message: `Unsupported x402 asset: ${accepted.asset}`,
    });
  }

  const locationResult = await ensureLocation({
    accountId,
    live,
    currency,
    preferredBlockchains: [ARC_BLOCKCHAIN],
  });

  if (!locationResult.ok) {
    return err({
      type: "X402PaymentRecordError",
      message: "Unable to resolve Arc Pay wallet location",
    });
  }

  let mandate: PaymentMandate | undefined = undefined;
  const amount = mapX402Amount({
    amount: accepted.amount,
    negative: false,
  });

  if (mandateSecret) {
    const fetchedMandate = await getPaymentMandate({
      secret: mandateSecret,
      live,
    });

    if (!fetchedMandate) {
      return err({
        type: "X402PaymentRecordError",
        message: "Payment mandate not found",
      });
    }

    if (fetchedMandate.status !== "active") {
      return err({
        type: "X402PaymentRecordError",
        message: "Payment mandate is inactive",
      });
    }

    const mandateCurrency =
      fetchedMandate.type === "single_use"
        ? fetchedMandate.single_use.currency
        : fetchedMandate.multi_use.currency;
    const mandateAmount =
      fetchedMandate.type === "single_use"
        ? fetchedMandate.single_use.amount_limit
        : fetchedMandate.multi_use.amount_limit;

    if (Big(mandateAmount).lt(Big(amount)) || mandateCurrency !== currency) {
      return err({
        type: "X402PaymentRecordError",
        message: "Payment mandate does not match amount or currency",
      });
    }

    mandate = useValidPaymentMandate({
      amount,
      paymentMandate: fetchedMandate,
    });
  }

  const metadata: PaymentMetadata = {
    protocol: "x402",
    resource: resource.url,
    scheme: accepted.scheme,
    network: accepted.network,
    pay_to: accepted.payTo,
  };

  const payment: Payment = {
    id: paymentId(),
    live,
    amount,
    currency,
    method: "crypto",
    crypto: {
      blockchain: ARC_BLOCKCHAIN,
      address: accepted.payTo,
    },
    fees: [],
    status: "succeeded",
    trigger: mandate ? { method: "capture" } : { method: "user" },
    authorization: mandate
      ? { method: "mandate", mandate: mandate.id }
      : { method: "user" },
    created_at: new Date(),
    finished_at: new Date(),
    metadata,
  };

  const transaction: PaymentTransaction = {
    id: transactionId(),
    status: "completed",
    live,
    amount: mapX402Amount({
      amount: accepted.amount,
      negative: true,
    }),
    currency,
    type: "payment",
    network: "blockchain",
    location: locationResult.value.id,
    payment: payment.id,
    blockchain: {
      hash: settlement.transaction,
      counterparty: accepted.payTo,
    },
    created_at: new Date(),
    finished_at: new Date(),
  };

  const receiverLocation = await loadLocationByAddress({
    address: accepted.payTo,
    blockchain: ARC_BLOCKCHAIN,
    live,
  });

  const receiverCapture: PaymentCapture | undefined =
    receiverLocation && receiverLocation.owner !== accountId
      ? {
          id: paymentCaptureId(),
          live,
          amount,
          currency,
          method: "crypto",
          status: "succeeded",
          authorization: mandateSecret
            ? {
                method: "mandate" as const,
                granted_mandate_secret: mandateSecret,
              }
            : { method: "sender" as const },
          created_at: new Date(),
          finished_at: new Date(),
          metadata,
        }
      : undefined;

  const receiverTransaction: PaymentTransaction | undefined =
    receiverLocation && receiverCapture
      ? {
          id: transactionId(),
          status: "completed",
          live,
          amount,
          currency,
          type: "payment",
          network: "blockchain",
          location: receiverLocation.id,
          capture: receiverCapture.id,
          blockchain: {
            hash: settlement.transaction,
            counterparty: locationResult.value.address,
          },
          created_at: new Date(),
          finished_at: new Date(),
        }
      : undefined;

  await savePaymentsWithTransactionsAndCaptures([
    {
      accountId,
      payments: [payment],
      transactions: [transaction],
      paymentCaptures: [],
      mandates: mandate ? [mandate] : [],
    },
    ...(receiverLocation && receiverCapture && receiverTransaction
      ? [
          {
            accountId: receiverLocation.owner,
            payments: [],
            transactions: [receiverTransaction],
            paymentCaptures: [receiverCapture],
            mandates: [],
          },
        ]
      : []),
  ]);

  return ok({ payment, transaction, mandate, capture: receiverCapture });
};
