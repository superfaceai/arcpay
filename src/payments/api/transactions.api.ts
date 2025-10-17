import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withValidation, withAuth } from "@/api/middlewares";

import {
  getWalletTransactions,
  GetWalletTransactionsDTO,
  sendMoney,
  SendMoneyDTO,
} from "@/payments/services";
import { loadWalletById } from "@/payments/entities";

export const transactionsApi = createApi()
  .get(
    "/wallets/:walletId/transactions",
    withAuth(),
    withValidation("query", GetWalletTransactionsDTO),
    async (c) => {
      const wallet = await loadWalletById({
        walletId: c.req.param("walletId"),
        userId: c.get("userId"),
        live: c.get("isLive"),
      });

      if (!wallet) return ProblemJson(c, 404, "Not Found", "Wallet not found");

      const transactions = await getWalletTransactions({
        wallet,
        dto: c.req.valid("query"),
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
  )
  .post(
    "/wallets/:walletId/transactions",
    withAuth(),
    withValidation("json", SendMoneyDTO),
    async (c) => {
      const wallet = await loadWalletById({
        walletId: c.req.param("walletId"),
        userId: c.get("userId"),
        live: c.get("isLive"),
      });

      if (!wallet) return ProblemJson(c, 404, "Not Found", "Wallet not found");

      const dto = c.req.valid("json");

      const sendMoneyResult = await sendMoney(wallet, dto);

      if (!sendMoneyResult.ok) {
        if (sendMoneyResult.error.type === "CircleFetchBalanceError") {
          return ProblemJson(
            c,
            500,
            "Trouble fetching balance on the issuer's network",
            sendMoneyResult.error.message
          );
        } else if (
          sendMoneyResult.error.type === "CircleValidateAddressError"
        ) {
          return ProblemJson(
            c,
            500,
            "Trouble validating address on the issuer's network",
            sendMoneyResult.error.message
          );
        } else if (
          sendMoneyResult.error.type === "CircleCreateTransactionError"
        ) {
          return ProblemJson(
            c,
            500,
            "Trouble creating transaction on the issuer's network",
            sendMoneyResult.error.message
          );
        } else if (
          sendMoneyResult.error.type === "PaymentInsufficientBalanceError"
        ) {
          return ProblemJson(
            c,
            409,
            "Insufficient Balance",
            `Not enough funds to send. Please deposit funds to your wallet. Required: ${sendMoneyResult.error.requiredAmount}, Available: ${sendMoneyResult.error.availableAmount}`
          );
        } else if (
          sendMoneyResult.error.type === "PaymentInvalidAddressError"
        ) {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            "The recipient address is invalid or on the wrong network"
          );
        } else if (
          sendMoneyResult.error.type === "PaymentUnsupportedTokenError"
        ) {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `The currency '${sendMoneyResult.error.token}' is not supported on this network`
          );
        } else {
          return ProblemJson(c, 500, "Internal Server Error");
        }
      }

      return c.json(ApiObject("transaction", sendMoneyResult.value));
    }
  );
