import { createApi } from "@/api/services";
import { withAuth, withIdempotency, withValidation } from "@/api/middlewares";
import { delegatePayment } from "@/payments/services";

import {
  DelegatePaymentRequest as ACPDelegatePaymentRequest,
  ResponseError as ACPResponseError,
} from "@/acp/interfaces";
import {
  mapDelegatePaymentRequest,
  mapDelegatePaymentResponse,
} from "@/acp/services";

export const acpDelegatedPaymentsApi = createApi().post(
  "/agentic_commerce/delegate_payment",
  withAuth(), // TODO: Map to ACP response error
  withIdempotency(), // TODO: Map to ACP response error
  withValidation("json", ACPDelegatePaymentRequest, (c, target, errors) => {
    return c.json(
      <ACPResponseError>{
        type: "invalid_request",
        code: "invalid_request",
        message: errors[0].message,
        param: `$.${errors[0].path.join(".")}`,
      },
      { status: 400 }
    );
  }),
  async (c) => {
    const delegatePaymentRequest: ACPDelegatePaymentRequest =
      c.req.valid("json");

    const delegatePaymentDTOResult = mapDelegatePaymentRequest(
      delegatePaymentRequest
    );

    if (!delegatePaymentDTOResult.ok) {
      if (
        delegatePaymentDTOResult.error.type ===
        "PaymentUnsupportedPaymentMethodError"
      ) {
        return c.json(
          <ACPResponseError>{
            type: "invalid_request",
            code: "invalid_card",
            message: `The payment method '${delegatePaymentDTOResult.error.method}' is not supported`,
            param: `$.payment_method.type`,
          },
          400
        );
      }

      return c.json(
        <ACPResponseError>{
          type: "invalid_request",
          code: "invalid_request",
          message: `The currency '${delegatePaymentDTOResult.error.currency}' is not supported`,
          param: `$.allowance.currency`,
        },
        400
      );
    }

    const delegatePaymentResult = await delegatePayment({
      accountId: c.get("accountId"),
      live: c.get("isLive"),
      dto: delegatePaymentDTOResult.value,
    });

    if (!delegatePaymentResult.ok) {
      if (
        delegatePaymentResult.error.type ===
        "PaymentUnsupportedPaymentMethodError"
      ) {
        return c.json(
          <ACPResponseError>{
            type: "invalid_request",
            code: "invalid_card",
            message: `The payment method '${delegatePaymentResult.error.method}' is not supported`,
            param: `$.payment_method.type`,
          },
          400
        );
      }
      if (delegatePaymentResult.error.type === "PaymentMandateExpiredError") {
        return c.json(
          <ACPResponseError>{
            type: "invalid_request",
            code: "invalid_request",
            message: `The expiration date of the mandate has passed`,
            param: `$.expires_at`,
          },
          400
        );
      }
      if (
        delegatePaymentResult.error.type === "PaymentInsufficientBalanceError"
      ) {
        return c.json(
          <ACPResponseError>{
            type: "invalid_request",
            // code: "",
            message: `You do not have enough ${delegatePaymentResult.error.currency} to pay ${delegatePaymentResult.error.requiredAmount}`,
            param: `$.allowance.max_amount`,
          },
          400
        );
      }
      if (delegatePaymentResult.error.type === "BlockchainWalletActionError") {
        return c.json(
          <ACPResponseError>{
            type: "processing_error",
            // code: "",
            message: delegatePaymentResult.error.message,
          },
          500
        );
      }

      throw new Error(delegatePaymentResult.error);
    }

    return c.json(mapDelegatePaymentResponse(delegatePaymentResult.value), 201);
  }
);
