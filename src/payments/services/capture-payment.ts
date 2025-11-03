import { z } from "zod";
import Big from "big.js";

import { err, ok, Result } from "@/lib";

import { Amount, Currency } from "@/balances/values";

import { PaymentMetadata } from "@/payments/values";
import {
  PaymentCapture,
  paymentCaptureId,
  PaymentMandateSecret,
  savePaymentCapture,
} from "@/payments/entities";

import {
  PaymentMandateInactiveError,
  PaymentMandateNotFoundError,
  PaymentMandateMismatchError,
} from "@/payments/errors";
import { getPaymentMandate } from "./get-payment-mandate";

export const CapturePaymentDTO = z.object({
  amount: Amount,
  currency: Currency,
  granted_mandate_secret: PaymentMandateSecret,
  metadata: PaymentMetadata.optional(),
});

export const capturePayment = async ({
  accountId,
  live,
  dto,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof CapturePaymentDTO>;
}): Promise<
  Result<
    PaymentCapture,
    | PaymentMandateNotFoundError
    | PaymentMandateInactiveError
    | PaymentMandateMismatchError
  >
> => {
  const grantedMandate = await getPaymentMandate({
    secret: dto.granted_mandate_secret,
    live,
  });

  if (!grantedMandate)
    return err({
      type: "PaymentMandateNotFoundError",
      secret: dto.granted_mandate_secret,
    });

  if (grantedMandate.status !== "active")
    return err({
      type: "PaymentMandateInactiveError",
      inactiveReason: grantedMandate.inactive_reason,
    });

  const mandateCurrency =
    grantedMandate.type === "single_use"
      ? grantedMandate.single_use.currency
      : grantedMandate.multi_use.currency;

  const mandateAmount =
    grantedMandate.type === "single_use"
      ? grantedMandate.single_use.amount_limit
      : grantedMandate.multi_use.amount_limit;

  if (
    Big(mandateAmount).lt(Big(dto.amount)) ||
    mandateCurrency !== dto.currency
  ) {
    return err({
      type: "PaymentMandateMismatchError",
      mandateGiven: {
        currency: mandateCurrency,
        amount: mandateAmount,
      },
      captureRequired: {
        currency: dto.currency,
        amount: dto.amount,
      },
    });
  }

  const paymentCapture: PaymentCapture = PaymentCapture.parse({
    id: paymentCaptureId(),
    live: live,
    amount: dto.amount,
    currency: dto.currency,
    granted_mandate_secret: dto.granted_mandate_secret,
    method: grantedMandate.method,
    status: "processing",
    created_at: new Date(),
    ...(dto.metadata ? { metadata: dto.metadata } : {}),
  });
  await savePaymentCapture({ paymentCapture, accountId });

  // TODO: Execute payment capture
  // Payment (linked to mandate) -> Transaction[] for payer
  // PaymentCapture -> Transaction[] for receiver
  // PaymentCapture -> used

  return ok(paymentCapture);
};
