import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withValidation, withAuth, withIdempotency } from "@/api/middlewares";

import {
  CapturePaymentDTO,
  ListPaymentCapturesDTO,
  capturePayment,
  listPaymentCaptures,
} from "@/payments/services";

export const paymentCapturesApi = createApi()
  .post(
    "/payment_captures",
    withAuth(),
    withIdempotency(),
    withValidation("json", CapturePaymentDTO),
    async (c) => {
      const dto = c.req.valid("json");
      const capturePaymentResult = await capturePayment({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        dto: dto,
      });

      if (!capturePaymentResult.ok) {
        if (capturePaymentResult.error.type === "PaymentMandateNotFoundError") {
          return ProblemJson(
            c,
            400,
            "Payment mandate not found",
            `The payment mandate with secret '${dto.granted_mandate_secret}' was not found`
          );
        }

        if (capturePaymentResult.error.type === "PaymentMandateInactiveError") {
          return ProblemJson(
            c,
            409,
            "Payment mandate is inactive",
            `The payment mandate is already ${capturePaymentResult.error.inactiveReason}`
          );
        }

        if (capturePaymentResult.error.type === "PaymentMandateMismatchError") {
          return ProblemJson(
            c,
            409,
            "Payment mandate mismatch",
            `The capture requirements do not match the granted mandate. You want to capture ${capturePaymentResult.error.captureRequired.amount} ${capturePaymentResult.error.captureRequired.currency}, but the granted mandate has limit of ${capturePaymentResult.error.mandateGiven.amount} ${capturePaymentResult.error.mandateGiven.currency}`
          );
        }

        throw new Error(capturePaymentResult.error);
      }

      return c.json(ApiObject("payment_capture", capturePaymentResult.value));
    }
  )
  .get(
    "/payment_captures",
    withAuth(),
    withValidation("query", ListPaymentCapturesDTO),
    async (c) => {
      const dto = c.req.valid("query");

      const paymentCaptures = await listPaymentCaptures({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        dto,
      });

      if (!paymentCaptures.ok) {
        return ProblemJson(
          c,
          500,
          "Trouble fetching payment captures",
          paymentCaptures.error.message
        );
      }

      return c.json(ApiList("payment_capture", paymentCaptures.value));
    }
  );
