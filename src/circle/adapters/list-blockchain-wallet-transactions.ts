import { tryAsync } from "@/lib";
import { ListBlockchainWalletTransactions } from "@/payments/interfaces";

import { client } from "../client";

import { mapCircleTransaction } from "../services/map-circle-transaction";
import { getCircleWalletIds } from "../services/get-circle-wallet-ids";

export const listBlockchainWalletTransactions: ListBlockchainWalletTransactions =
  async ({ wallets, from, to, live }) =>
    tryAsync(
      async () => {
        const { circleWalletIds, walletIdToLocation } =
          await getCircleWalletIds({
            wallets,
            live,
          });

        if (circleWalletIds.length === 0) return [];

        // TODO: Paginate through all
        const transactions = await client.listTransactions({
          walletIds: circleWalletIds,
          operation: "TRANSFER",
          order: "DESC",
          ...(from ? { from: from.toISOString() } : {}),
          ...(to ? { to: to.toISOString() } : {}),
          pageSize: 50,
          includeAll: true,
        });

        const circleTransactions = transactions.data?.transactions || [];

        if (circleTransactions.length === 0) return [];

        const mappedTransactions = (
          await Promise.all(
            circleTransactions.flatMap((circleTx) =>
              mapCircleTransaction({ circleTx, walletIdToLocation })
            )
          )
        ).flat();

        return mappedTransactions;
      },
      (error) => ({
        type: "BlockchainPaymentActionError",
        message: String(error),
      })
    );
