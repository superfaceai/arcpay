import { createApi } from "@/api/services";
import { ProblemJson, ApiList } from "@/api/values";
import { withValidation, withAuth } from "@/api/middlewares";

import { ListTransactionsDTO, listTransactions } from "@/payments/services";

export const transactionsApi = createApi().get(
  "/transactions",
  withAuth(),
  withValidation("query", ListTransactionsDTO),
  async (c) => {
    const transactions = await listTransactions({
      filter: c.req.valid("query"),
      accountId: c.get("accountId"),
      live: c.get("isLive"),
    });

    if (!transactions.ok) {
      return ProblemJson(
        c,
        500,
        "Trouble fetching transactions on the issuer's network",
        transactions.error.message
      );
    }

    return c.json(ApiList("transaction", transactions.value));
  }
);
