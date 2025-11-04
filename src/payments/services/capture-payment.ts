import { z } from "zod";
import Big from "big.js";

import { err, ok, Result } from "@/lib";

import { loadAccountById } from "@/identity/entities";
import { Amount, Currency, StablecoinToken } from "@/balances/values";

import { PaymentMetadata } from "@/payments/values";
import { PaymentCapture, PaymentMandateSecret } from "@/payments/entities";
import {
  PaymentMandateInactiveError,
  PaymentMandateNotFoundError,
  PaymentMandateMismatchError,
  PaymentUnsupportedPaymentMethodError,
  PaymentCaptureError,
} from "@/payments/errors";

import { getPaymentMandate } from "./get-payment-mandate";
import { pay, PayDTO } from "./pay";

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
    | PaymentUnsupportedPaymentMethodError
    | PaymentCaptureError
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

  const senderAccountId = grantedMandate.on_behalf_of;
  let paymentDto: PayDTO;

  if (grantedMandate.method === "arc_pay") {
    const receiverAccount = await loadAccountById(accountId);

    paymentDto = {
      amount: dto.amount,
      currency: dto.currency as StablecoinToken,
      method: "arc_pay",
      arc_pay: {
        account: receiverAccount!.handle,
      },
      metadata: grantedMandate.metadata,
    };
  } else {
    // TODO: Implement other payment methods
    return err({
      type: "PaymentUnsupportedPaymentMethodError",
      method: grantedMandate.method,
    });
  }

  const payResult = await pay({
    live,
    trigger: {
      senderAccountId,
      trigger: "capture",
      captureMetadata: dto.metadata,
      authorization: {
        method: "mandate",
        mandate: grantedMandate,
      },
    },
    dto: paymentDto,
  });

  if (!payResult.ok) {
    // Mapping payment error here not to leak the sender payment errors to the receiver
    return err({
      type: "PaymentCaptureError",
    });
  }

  const { receiver } = payResult.value;

  if (!receiver.hasArcPay || !receiver.paymentCapture) {
    // This should never happen, but we'll handle it just in case
    return err({
      type: "PaymentCaptureError",
    });
  }

  return ok(receiver.paymentCapture);
};
