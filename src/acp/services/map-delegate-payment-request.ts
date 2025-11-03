import { DelegatePaymentRequest } from "@/acp/interfaces";
import { err, ok, Result } from "@/lib";
import {
  PaymentUnsupportedPaymentMethodError,
  PaymentUnsupportedCurrencyError,
} from "@/payments/errors";

import { DelegatePaymentDTO } from "@/payments/services";
import { mapCurrencyAmount } from "./map-currency-amount";

export const mapDelegatePaymentRequest = (
  request: DelegatePaymentRequest
): Result<
  DelegatePaymentDTO,
  PaymentUnsupportedPaymentMethodError | PaymentUnsupportedCurrencyError
> => {
  // Billing address is thrown away
  // Risk signals are thrown away

  if (request.payment_method.type === "card") {
    return err({
      type: "PaymentUnsupportedPaymentMethodError",
      method: request.payment_method.type,
    });
  }

  const currencyAmountResult = mapCurrencyAmount({
    amount: request.allowance.max_amount,
    currency: request.allowance.currency,
  });

  if (!currencyAmountResult.ok) return currencyAmountResult;

  return ok({
    type: "single_use", // allowance.reason is always "one_time"
    single_use: {
      amount_limit: currencyAmountResult.value.amount,
      currency: currencyAmountResult.value.currency,
    },
    method: "arc_pay",
    metadata: {
      ...request.metadata,
      acp_checkout_session_id: request.allowance.checkout_session_id,
    },
    merchant_id: request.allowance.merchant_id,
    expires_at: request.allowance.expires_at,
  });
};
