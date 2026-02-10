import { z } from "zod";

import { createApi } from "@/api/services";
import { ProblemJson } from "@/api/values";
import { withAuth, withValidation } from "@/api/middlewares";

import { verify, settle, getSupported } from "@/arc-facilitator/services";

const VerifySettleDTO = z.object({
  paymentPayload: z.record(z.string(), z.unknown()),
  paymentRequirements: z.record(z.string(), z.unknown()),
});

export const facilitatorApi = createApi()
  .get("/facilitator/supported", withAuth(), async (c) => {
    try {
      const response = getSupported();
      return c.json(response);
    } catch (error) {
      console.error("[arc-facilitator] Supported error:", error);
      return ProblemJson(
        c,
        500,
        "Internal Server Error",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  })
  .post(
    "/facilitator/verify",
    withAuth(),
    withValidation("json", VerifySettleDTO),
    async (c) => {
      try {
        const { paymentPayload, paymentRequirements } = c.req.valid("json");

        const response = await verify(
          paymentPayload as Parameters<typeof verify>[0],
          paymentRequirements as Parameters<typeof verify>[1],
        );

        return c.json(response);
      } catch (error) {
        console.error("[arc-facilitator] Verify error:", error);
        return ProblemJson(
          c,
          500,
          "Internal Server Error",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  )
  .post(
    "/facilitator/settle",
    withAuth(),
    withValidation("json", VerifySettleDTO),
    async (c) => {
      const { paymentPayload, paymentRequirements } = c.req.valid("json");

      try {
        const response = await settle(
          paymentPayload as Parameters<typeof settle>[0],
          paymentRequirements as Parameters<typeof settle>[1],
        );

        return c.json(response);
      } catch (error) {
        console.error("[arc-facilitator] Settle error:", error);

        const errorReason =
          error instanceof Error &&
          error.message.includes("Settlement aborted:")
            ? error.message.replace("Settlement aborted: ", "")
            : error instanceof Error
              ? error.message
              : "Unknown error";

        return c.json({
          success: false,
          errorReason,
          network:
            (paymentPayload as Record<string, unknown>)?.network || "unknown",
        });
      }
    },
  );
