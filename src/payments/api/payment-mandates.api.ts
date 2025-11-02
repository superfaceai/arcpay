import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withValidation, withAuth, withIdempotency } from "@/api/middlewares";

import {
  ListPaymentMandatesDTO,
  listPaymentMandates,
  revokePaymentMandate,
} from "@/payments/services";

export const paymentMandatesApi = createApi()
  .get(
    "/payment_mandates",
    withAuth(),
    withValidation("query", ListPaymentMandatesDTO),
    async (c) => {
      const paymentMandatesListResult = await listPaymentMandates({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        dto: c.req.valid("query"),
      });

      if (!paymentMandatesListResult.ok) {
        return ProblemJson(
          c,
          500,
          "Server error while loading payment mandates"
        );
      }

      return c.json(
        ApiList("payment_mandate", paymentMandatesListResult.value)
      );
    }
  )
  .post(
    "/payment_mandates/:mandateId/revoke",
    withAuth(),
    withIdempotency(),
    async (c) => {
      const revokePaymentMandateResult = await revokePaymentMandate({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        idOrSecret: c.req.param("mandateId"),
      });

      if (!revokePaymentMandateResult.ok) {
        if (
          revokePaymentMandateResult.error.type ===
          "PaymentMandateInactiveError"
        ) {
          return ProblemJson(
            c,
            400,
            `Payment mandate is already ${revokePaymentMandateResult.error.inactiveReason}`
          );
        }

        throw new Error(revokePaymentMandateResult.error.type);
      }

      if (!revokePaymentMandateResult.value) {
        return ProblemJson(c, 404, "Payment mandate not found");
      }

      return c.json(
        ApiObject("payment_mandate", revokePaymentMandateResult.value)
      );
    }
  );
