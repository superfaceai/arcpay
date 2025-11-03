import { z } from "zod";

import { Result } from "@/lib";

import {
  BlockchainWalletActionError,
  UnsupportedBlockchainError,
} from "@/balances/errors";

import { Payment } from "@/payments/entities";

import {
  PaymentInsufficientBalanceError,
  PaymentUnsupportedTokenError,
  PaymentInvalidCryptoAddressError,
  BlockchainPaymentActionError,
  PaymentUnsupportedPaymentMethodError,
  PaymentInvalidAccountError,
} from "@/payments/errors";

import { payToCrypto, PayToCryptoDTO } from "@/payments/services/pay-to-crypto";
import {
  payToArcPay,
  PayToArcPayDTO,
} from "@/payments/services/pay-to-arcpay";

export const PayDTO = z.discriminatedUnion("method", [
  PayToCryptoDTO,
  PayToArcPayDTO,
]);

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
    Payment,
    | PaymentUnsupportedPaymentMethodError // from Arc Pay
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
