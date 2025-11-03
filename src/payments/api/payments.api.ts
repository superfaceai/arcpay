import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withValidation, withAuth, withIdempotency } from "@/api/middlewares";

import {
  PayDTO,
  pay,
  ListPaymentsDTO,
  listPayments,
} from "@/payments/services";

export const paymentsApi = createApi()
  .get(
    "/payments",
    withAuth(),
    withValidation("query", ListPaymentsDTO),
    async (c) => {
      const paymentsListResult = await listPayments({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        dto: c.req.valid("query"),
      });

      if (!paymentsListResult.ok) {
        return ProblemJson(
          c,
          500,
          "Trouble fetching payments",
          paymentsListResult.error.message
        );
      }

      return c.json(ApiList("payment", paymentsListResult.value));
    }
  )
  .post(
    "/payments",
    withAuth(),
    withIdempotency(),
    withValidation("json", PayDTO),
    async (c) => {
      const paymentResult = await pay({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        dto: c.req.valid("json"),
      });

      if (!paymentResult.ok) {
        if (paymentResult.error.type === "PaymentInsufficientBalanceError") {
          return ProblemJson(
            c,
            409,
            "Insufficient balance",
            `You do not have enough ${paymentResult.error.currency} to pay ${paymentResult.error.requiredAmount}`
          );
        }
        if (paymentResult.error.type === "PaymentUnsupportedTokenError") {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `The currency '${paymentResult.error.token}' is not supported on this network`
          );
        }
        if (paymentResult.error.type === "PaymentInvalidCryptoAddressError") {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `The crypto address '${paymentResult.error.address}' is not a valid ${paymentResult.error.blockchain} address`
          );
        }
        if (paymentResult.error.type === "PaymentInvalidAccountError") {
          const reasonMessage =
            paymentResult.error.invalidReason === "not_found"
              ? `The account '${paymentResult.error.handle}' does not exist`
              : `The payment is not allowed to be sent to yourself`;

          return ProblemJson(c, 400, "Bad Request", reasonMessage);
        }
        if (paymentResult.error.type === "BlockchainPaymentActionError") {
          return ProblemJson(
            c,
            500,
            `Blockchain payment action error on ${paymentResult.error.blockchain}`,
            paymentResult.error.message
          );
        }
        if (paymentResult.error.type === "BlockchainWalletActionError") {
          return ProblemJson(
            c,
            500,
            `Blockchain wallet action error on ${paymentResult.error.blockchain}`,
            paymentResult.error.message
          );
        }
        if (
          paymentResult.error.type === "PaymentUnsupportedPaymentMethodError"
        ) {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `The payment method '${paymentResult.error.method}' is not supported`
          );
        }

        return ProblemJson(c, 500, "Trouble processing the payment");
      }

      return c.json(ApiObject("payment", paymentResult.value), { status: 201 });
    }
  );
