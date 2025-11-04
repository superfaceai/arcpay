import { v4 as uuidv4 } from "uuid";

import { ok, Result } from "@/lib";

import { Amount, Blockchain, Currency, mapAmount } from "@/balances/values";
import { BlockchainPaymentActionError } from "@/payments/errors";
import {
  Payment,
  PaymentCapture,
  paymentCaptureId,
  paymentId,
  PaymentMandate,
  PaymentTransaction,
  Transaction,
  transactionId,
} from "@/payments/entities";
import { savePaymentsWithTransactionsAndCaptures } from "@/payments/repositories";

import { SendBlockchainTransaction } from "@/payments/interfaces";
import { sendBlockchainTransaction } from "@/circle/adapters";
import {
  PaymentMethodArcPay,
  PaymentMethodCrypto,
  PaymentMethodTypeArcPay,
  PaymentMethodTypeCrypto,
  PaymentMetadata,
} from "@/payments/values";
import { PayOutcome, PayTrigger } from "./pay";
import { useValidPaymentMandate } from "./use-payment-mandate";

type PaymentDetailsMethodCrypto = {
  method: PaymentMethodTypeCrypto;
  crypto: PaymentMethodCrypto;
};
type PaymentDetailsMethodArcPay = {
  method: PaymentMethodTypeArcPay;
  arc_pay: PaymentMethodArcPay;
};
type PaymentDetailsMethod =
  | PaymentDetailsMethodCrypto
  | PaymentDetailsMethodArcPay;

type PaymentDetails = PaymentDetailsMethod & {
  amount: Amount;
  currency: Currency;
  tokenAddress: string;
  metadata?: PaymentMetadata;
};

type Sender = {
  accountId: string;
  locationId: string;
  blockchain: Blockchain;
  address: string;
};

type ExternalReceiver = {
  hasArcPay: false;
  blockchain: Blockchain;
  address: string;
};
type InternalReceiver = {
  hasArcPay: true;
  accountId: string;
  locationId: string;
  blockchain: Blockchain;
  address: string;
};
type Receiver = ExternalReceiver | InternalReceiver;

/**
 * Low-level service to invoke to execute a crypto payment.
 * Should be called by higher-level services that do necessary validations & checks.
 */
export const transactViaCrypto = async ({
  live,
  sender,
  receiver,
  payment,
  trigger,
  sendBlockchainTransactionAdapter = sendBlockchainTransaction,
}: {
  live: boolean;
  sender: Sender;
  receiver: Receiver;
  payment: PaymentDetails;
  trigger: PayTrigger;
  sendBlockchainTransactionAdapter?: SendBlockchainTransaction;
}): Promise<Result<PayOutcome, BlockchainPaymentActionError>> => {
  const senderPaymentsBeforeTx: Payment[] = [];
  const senderTransactionsBeforeTx: Transaction[] = [];
  let senderMandateBeforeTx: PaymentMandate | undefined = undefined;
  let receiverPaymentCaptureBeforeTx: PaymentCapture | undefined = undefined;

  const senderPayment: Payment = {
    id: paymentId(),
    amount: mapAmount(payment.amount, { negative: false }),
    currency: payment.currency,
    method: payment.method,
    ...(payment.method === "crypto" ? { crypto: payment.crypto } : {}),
    ...(payment.method === "arc_pay" ? { arc_pay: payment.arc_pay } : {}),
    fees: [],
    status: "pending",
    trigger:
      trigger.trigger === "user" ? { method: "user" } : { method: "capture" },
    authorization:
      trigger.authorization.method === "mandate"
        ? { method: "mandate", mandate: trigger.authorization.mandate.id }
        : { method: "user" },
    live,
    created_at: new Date(),
    ...(payment.metadata ? { metadata: payment.metadata } : {}),
  };

  const senderTransaction: PaymentTransaction = {
    id: transactionId(),
    status: "queued",
    live,
    amount: mapAmount(payment.amount, { negative: true }),
    currency: payment.currency,
    type: "payment",
    network: "blockchain",
    location: sender.locationId,
    blockchain: {
      hash: "n/a",
      counterparty: receiver.address,
    },
    payment: senderPayment.id,
    created_at: new Date(),
    fingerprint: uuidv4(),
  };
  senderPaymentsBeforeTx.push(senderPayment);
  senderTransactionsBeforeTx.push(senderTransaction);

  if (receiver.hasArcPay) {
    const receiverPaymentCapture: PaymentCapture = {
      id: paymentCaptureId(),
      amount: mapAmount(payment.amount, { negative: false }),
      currency: payment.currency,
      method: payment.method,
      status: "requires_capture",
      authorization:
        trigger.authorization.method === "mandate"
          ? {
              method: "mandate",
              granted_mandate_secret: trigger.authorization.mandate.secret,
            }
          : { method: "sender" },
      live,
      created_at: new Date(),
      ...(trigger.captureMetadata ? { metadata: trigger.captureMetadata } : {}),
    };
    receiverPaymentCaptureBeforeTx = receiverPaymentCapture;
  }

  if (trigger.authorization.method === "mandate") {
    const usedMandate: PaymentMandate = useValidPaymentMandate({
      amount: payment.amount,
      paymentMandate: trigger.authorization.mandate,
    });
    senderMandateBeforeTx = usedMandate;
  }

  await savePaymentsWithTransactionsAndCaptures([
    {
      accountId: sender.accountId,
      payments: senderPaymentsBeforeTx,
      transactions: senderTransactionsBeforeTx,
      paymentCaptures: [],
      mandates: senderMandateBeforeTx ? [senderMandateBeforeTx] : [],
    },
    ...(receiver.hasArcPay
      ? [
          {
            accountId: receiver.accountId,
            payments: [],
            transactions: [],
            paymentCaptures: receiverPaymentCaptureBeforeTx
              ? [receiverPaymentCaptureBeforeTx]
              : [],
            mandates: [],
          },
        ]
      : []),
  ]);

  // Send to blockchain --------------------------------------------------------
  const sentTransactionResult = await sendBlockchainTransactionAdapter({
    transaction: senderTransaction,
    sourceAddress: sender.address,
    destinationAddress: receiver.address,
    tokenAddress: payment.tokenAddress,
    blockchain: sender.blockchain,
    live,
  });

  if (!sentTransactionResult.ok) return sentTransactionResult;
  // ---------------------------------------------------------------------------
  const senderTransactionsAfterTx: Transaction[] = [];
  let receiverPaymentCaptureAfterTx: PaymentCapture | undefined = undefined;
  const receiverTransactionsAfterTx: Transaction[] = [];

  const { payment: senderPaymentTx, fee: senderFeeTx } =
    sentTransactionResult.value;

  const senderFeeTransaction = senderFeeTx
    ? {
        id: transactionId(),
        live,
        payment: senderPayment.id,
        ...senderFeeTx,
      }
    : undefined;

  senderTransactionsAfterTx.push(senderPaymentTx);
  if (senderFeeTransaction) {
    senderTransactionsAfterTx.push(senderFeeTransaction);
  }

  if (receiver.hasArcPay) {
    const receiverTransaction: PaymentTransaction = {
      id: transactionId(),
      status: "queued",
      live,
      amount: mapAmount(payment.amount, { negative: false }),
      currency: payment.currency,
      type: "payment",
      network: "blockchain",
      location: receiver.locationId,
      blockchain: {
        hash: senderPaymentTx.blockchain.hash, // key to match the on-chain tx
        counterparty: sender.address,
      },
      capture: receiverPaymentCaptureBeforeTx!.id,
      created_at: new Date(),
    };
    const receiverCaptureProcessing: PaymentCapture = {
      ...receiverPaymentCaptureBeforeTx!,
      status: "processing",
    };

    receiverTransactionsAfterTx.push(receiverTransaction);
    receiverPaymentCaptureAfterTx = receiverCaptureProcessing;
  }

  await savePaymentsWithTransactionsAndCaptures([
    {
      accountId: sender.accountId,
      payments: [],
      transactions: senderTransactionsAfterTx,
      paymentCaptures: [],
      mandates: [],
    },
    ...(receiver.hasArcPay
      ? [
          {
            accountId: receiver.accountId,
            payments: [],
            transactions: receiverTransactionsAfterTx,
            paymentCaptures: receiverPaymentCaptureAfterTx
              ? [receiverPaymentCaptureAfterTx]
              : [],
            mandates: [],
          },
        ]
      : []),
  ]);

  return ok({
    sender: {
      mandate: undefined,
      payment: senderPayment,
      transactions: [
        senderPaymentTx,
        ...(senderFeeTransaction ? [senderFeeTransaction] : []),
      ],
    },
    receiver: receiver.hasArcPay
      ? {
          hasArcPay: true,
          paymentCapture: receiverPaymentCaptureAfterTx!,
          transactions: receiverTransactionsAfterTx,
        }
      : {
          hasArcPay: false,
        },
  });
};
