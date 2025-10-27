import { createApi } from "@/api/services";
import { ProblemJson, ApiObject } from "@/api/values";
import { withValidation, withAuth, withIdempotency } from "@/api/middlewares";

import { depositMoney, DepositMoneyDTO } from "@/payments/services";

export const depositsApi = createApi().post(
  "/deposits",
  withAuth(),
  withIdempotency(),
  withValidation("json", DepositMoneyDTO),
  async (c) => {
    const userId = c.get("userId");
    const live = c.get("isLive");

    const depositResult = await depositMoney(
      { userId, live },
      c.req.valid("json")
    );

    if (!depositResult.ok) {
      if (depositResult.error.type === "BlockchainActionRateExceeded") {
        return ProblemJson(
          c,
          429,
          "Too Many Requests",
          "You have reached the coin issuer's limit for testnet funds. Please try again later."
        );
      } else if (depositResult.error.type === "UnsupportedBlockchainError") {
        return ProblemJson(
          c,
          400,
          "Bad Request",
          `The currency '${depositResult.error.currency}' is not supported on this network`
        );
      } else {
        return ProblemJson(c, 400, "Bad Request", depositResult.error.message);
      }
    }

    return c.json(ApiObject("deposit", depositResult.value));
  }
);
