import { createApi } from "@/api/services/index.js";
import { ProblemJson, ApiObject, ApiList } from "@/api/values/index.js";
import { withAuth } from "@/api/middlewares/index.js";

import { getWalletBalance } from "@/payments/services/index.js";
import { loadWalletsByUser, loadWalletById } from "@/payments/entities/index.js";

export const walletsApi = createApi()
  .get("/wallets", withAuth(), async (c) => {
    const wallets = await loadWalletsByUser({
      userId: c.get("userId"),
      live: c.get("isLive"),
    });

    return c.json(ApiList("wallet", wallets));
  })
  .get("/wallets/:walletId", withAuth(), async (c) => {
    const wallet = await loadWalletById({
      walletId: c.req.param("walletId"),
      userId: c.get("userId"),
      live: c.get("isLive"),
    });

    if (!wallet) return ProblemJson(c, 404, "Not Found", "Wallet not found");

    return c.json(ApiObject("wallet", wallet));
  })
  .get("/wallets/:walletId/balance", withAuth(), async (c) => {
    const wallet = await loadWalletById({
      walletId: c.req.param("walletId"),
      userId: c.get("userId"),
      live: c.get("isLive"),
    });

    if (!wallet) return ProblemJson(c, 404, "Not Found", "Wallet not found");

    const balance = await getWalletBalance(wallet);

    if (!balance.ok) {
      return ProblemJson(
        c,
        500,
        "Trouble fetching balance on the issuer's network",
        balance.error.message
      );
    }

    return c.json(ApiObject("balance", balance.value));
  });
