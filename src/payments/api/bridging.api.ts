import { z } from "zod";
import { createApi } from "@/api/services";
import { ProblemJson, ApiObject, ApiList } from "@/api/values";
import { withValidation, withAuth, withIdempotency } from "@/api/middlewares";

import {
  bridgeAmount,
  BridgeAmountDTO,
  retryBridgeTransfer,
} from "@/payments/services";
import {
  bridgeTransferSortDesc,
  loadBridgeTransferById,
  loadBridgeTransfersByAccount,
} from "../entities";
import { DateCodec } from "@/lib";

export const ListBridgeTransfersDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const bridgingApi = createApi()
  .post(
    "/bridge/transfers",
    withAuth(),
    withIdempotency(),
    withValidation("json", BridgeAmountDTO),
    async (c) => {
      const accountId = c.get("accountId");
      const live = c.get("isLive");

      const bridgeAmountResult = await bridgeAmount({
        accountId,
        live,
        dto: c.req.valid("json"),
      });

      if (!bridgeAmountResult.ok) {
        if (bridgeAmountResult.error.type === "BlockchainBridgeError") {
          return ProblemJson(
            c,
            500,
            "Error bridging amount on blockchain",
            bridgeAmountResult.error.message
          );
        }

        if (bridgeAmountResult.error.type === "BlockchainWalletActionError") {
          return ProblemJson(
            c,
            500,
            "Error checking balance on blockchain",
            bridgeAmountResult.error.message
          );
        }

        if (bridgeAmountResult.error.type === "BridgeTransferCurrencyError") {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `The currency '${bridgeAmountResult.error.currency}' cannot be bridged`
          );
        }

        if (bridgeAmountResult.error.type === "BridgeTransferLocationError") {
          if (bridgeAmountResult.error.reason === "not_found") {
            return ProblemJson(
              c,
              400,
              "Bad Request",
              `The location '${bridgeAmountResult.error.locationId}' doesn't exist`
            );
          }
          if (bridgeAmountResult.error.reason === "unsupported") {
            return ProblemJson(
              c,
              400,
              "Bad Request",
              `The location '${bridgeAmountResult.error.locationId}' cannot be used for bridging`
            );
          }
        }

        if (
          bridgeAmountResult.error.type === "PaymentInsufficientBalanceError"
        ) {
          return ProblemJson(
            c,
            400,
            "Bad Request",
            `You do not have enough ${bridgeAmountResult.error.currency} to bridge ${bridgeAmountResult.error.requiredAmount}`
          );
        }

        return ProblemJson(
          c,
          500,
          "Internal server error",
          "An unexpected error occurred while bridging the amount"
        );
      }

      return c.json(ApiObject("bridge_transfer", bridgeAmountResult.value), {
        status: 202,
      });
    }
  )
  .get(
    "/bridge/transfers",
    withAuth(),
    withValidation("query", ListBridgeTransfersDTO),
    async (c) => {
      const bridgeTransfers = await loadBridgeTransfersByAccount({
        accountId: c.get("accountId"),
        live: c.get("isLive"),
        from: c.req.valid("query").from,
        to: c.req.valid("query").to,
      });

      return c.json(
        ApiList("bridge_transfer", bridgeTransfers.sort(bridgeTransferSortDesc))
      );
    }
  )
  .post(
    "/bridge/transfers/:id/retry",
    withAuth(),
    withIdempotency(),
    async (c) => {
      const accountId = c.get("accountId");
      const live = c.get("isLive");
      const bridgeTransferId = c.req.param("id");

      const bridgeTransfer = await loadBridgeTransferById({
        accountId,
        bridgeTransferId,
        live,
      });

      if (!bridgeTransfer) {
        return ProblemJson(c, 404, "Not found", "Bridge transfer not found");
      }

      const retryResult = await retryBridgeTransfer({
        accountId,
        bridgeTransfer,
      });

      if (!retryResult.ok) {
        if (retryResult.error.type === "BlockchainBridgeError") {
          return ProblemJson(
            c,
            500,
            "Error bridging amount on blockchain",
            retryResult.error.message
          );
        }

        if (retryResult.error.type === "BridgeTransferRetryError") {
          if (retryResult.error.reason === "already_succeeded") {
            return ProblemJson(
              c,
              400,
              "Bad Request",
              "Bridge transfer has already succeeded"
            );
          }
          if (retryResult.error.reason === "already_retrying") {
            return ProblemJson(
              c,
              400,
              "Bad Request",
              "Bridge transfer is already being retried"
            );
          }
        }

        return ProblemJson(
          c,
          500,
          "Internal server error",
          "An unexpected error occurred while retrying the bridge transfer"
        );
      }

      return c.json(ApiObject("bridge_transfer", retryResult.value), {
        status: 202,
      });
    }
  );
