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
} from "../values";

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

export type TransactViaCryptoOutcome = {
  sender: {
    mandate: PaymentMandate | undefined;
    payment: Payment;
    transactions: Transaction[];
  };
  receiver:
    | {
        hasArcPay: boolean;
        paymentCapture: PaymentCapture;
        transactions: Transaction[];
      }
    | {
        hasArcPay: false;
      };
};

/**
 * Low-level service to invoke to execute a crypto payment.
 * Should be called by higher-level services that do necessary validations & checks.
 */
export const transactViaCrypto = async ({
  live,
  sender,
  receiver,
  payment,
  sendBlockchainTransactionAdapter = sendBlockchainTransaction,
}: {
  live: boolean;
  sender: Sender;
  receiver: Receiver;
  payment: PaymentDetails;
  sendBlockchainTransactionAdapter?: SendBlockchainTransaction;
}): Promise<Result<TransactViaCryptoOutcome, BlockchainPaymentActionError>> => {
  console.debug("TODO: Execute the crypto payment", {
    live,
    sender,
    receiver,
    payment,
  });

  const senderPaymentsBeforeTx: Payment[] = [];
  const senderTransactionsBeforeTx: Transaction[] = [];
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
    trigger: { method: "user" }, // TODO: Infer trigger
    authorization: { method: "user" }, // TODO: Run actual authorization logic
    live,
    created_at: new Date(),
    // metadata
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
      authorization: { method: "sender" }, // TODO: Run actual authorization logic
      live,
      created_at: new Date(),
      // metadata
    };
    receiverPaymentCaptureBeforeTx = receiverPaymentCapture;
  }

  await savePaymentsWithTransactionsAndCaptures([
    {
      accountId: sender.accountId,
      payments: senderPaymentsBeforeTx,
      transactions: senderTransactionsBeforeTx,
      paymentCaptures: [],
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
