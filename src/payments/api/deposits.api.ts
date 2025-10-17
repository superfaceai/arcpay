import { createApi } from "@/api/services/index.js";
import { ProblemJson, ApiObject, ApiList } from "@/api/values/index.js";
import { withValidation, withAuth } from "@/api/middlewares/index.js";

import { depositMoney, DepositMoneyDTO } from "@/payments/services/index.js";
import { loadWalletById, loadDepositsByWallet } from "@/payments/entities/index.js";

export const depositsApi = createApi()
  .get("/wallets/:walletId/deposits", withAuth(), async (c) => {
    const wallet = await loadWalletById({
      walletId: c.req.param("walletId"),
      userId: c.get("userId"),
      live: c.get("isLive"),
    });

    if (!wallet) return ProblemJson(c, 404, "Not Found", "Wallet not found");

    const deposits = await loadDepositsByWallet({
      walletId: wallet.id,
    });

    return c.json(ApiList("deposit", deposits));
  })
  .post(
    "/wallets/:walletId/deposits",
    withAuth(),
    withValidation("json", DepositMoneyDTO),
    async (c) => {
      const wallet = await loadWalletById({
        walletId: c.req.param("walletId"),
        userId: c.get("userId"),
        live: c.get("isLive"),
      });

      if (!wallet) return ProblemJson(c, 404, "Not Found", "Wallet not found");

      const depositResult = await depositMoney(wallet, c.req.valid("json"));

      if (!depositResult.ok) {
        if (depositResult.error.type === "CircleTooManyRequestsError") {
          return ProblemJson(
            c,
            429,
            "Too Many Requests",
            "You have reached the coin issuer's limit for testnet funds. Please try again later."
          );
        } else if (
          depositResult.error.type === "PaymentUnsupportedTokenError"
        ) {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `The currency '${depositResult.error.token}' is not supported on this network`
          );
        } else {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            depositResult.error.message
          );
        }
      }

      return c.json(ApiObject("deposit", depositResult.value));
    }
  );
