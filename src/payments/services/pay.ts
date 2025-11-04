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

export const PayDTO = z.discriminatedUnion("method", [
  PayToCryptoDTO,
  PayToArcPayDTO,
]);

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
  accountId,
  live,
  dto,
}: {
  accountId: string;
  live: boolean;
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
      accountId,
      live,
      dto,
    });
  } else if (dto.method === "arc_pay") {
    return payToArcPay({
      accountId,
      live,
      dto,
    });
  }

  throw new Error(`Unsupported payment: ${dto as string}`);
};
