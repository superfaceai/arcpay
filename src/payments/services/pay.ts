import { z } from "zod";

import { Result } from "@/lib";

import {
  BlockchainWalletActionError,
  UnsupportedBlockchainError,
} from "@/balances/errors";

import {
  Payment,
  PaymentCapture,
  PaymentMandate,
  Transaction,
} from "@/payments/entities";

import {
  PaymentInsufficientBalanceError,
  PaymentUnsupportedTokenError,
  PaymentInvalidCryptoAddressError,
  BlockchainPaymentActionError,
  PaymentInvalidAccountError,
} from "@/payments/errors";

import { payToCrypto, PayToCryptoDTO } from "./pay-to-crypto";
import { payToArcPay, PayToArcPayDTO } from "./pay-to-arcpay";
import { PaymentAuthorization, PaymentTrigger } from "@/payments/entities";

export const PayDTO = z.discriminatedUnion("method", [
  PayToCryptoDTO,
  PayToArcPayDTO,
]);

export type PayTrigger = {
  senderAccountId: string;
  trigger: PaymentTrigger["method"];
  authorization:
    | { method: "mandate"; mandate: PaymentMandate }
    | { method: "user" };
};

export type PayOutcome = {
  sender: {
    mandate: PaymentMandate | undefined;
    payment: Payment;
    transactions: Transaction[];
  };
  receiver:
    | {
        hasArcPay: true;
        paymentCapture: PaymentCapture;
        transactions: Transaction[];
      }
    | {
        hasArcPay: false;
      };
};

export const pay = async ({
  live,
  trigger,
  dto,
}: {
  live: boolean;
  trigger: PayTrigger;
  dto: z.infer<typeof PayDTO>;
}): Promise<
  Result<
    PayOutcome,
    | PaymentInvalidAccountError // from Arc Pay
    | UnsupportedBlockchainError // from Arc Pay
    | BlockchainPaymentActionError
    | BlockchainWalletActionError
    | PaymentInvalidCryptoAddressError
    | PaymentUnsupportedTokenError
    | PaymentInsufficientBalanceError
  >
> => {
  if (dto.method === "crypto") {
    return payToCrypto({
      live,
      trigger,
      dto,
    });
  } else if (dto.method === "arc_pay") {
    return payToArcPay({
      live,
      trigger,
      dto,
    });
  }

  throw new Error(`Unsupported payment: ${dto as string}`);
};
