import { TokenBlockchain } from "@circle-fin/developer-controlled-wallets";

import { tryAsync } from "@/lib";
import {
  BlockchainTransaction,
  SendBlockchainTransaction,
} from "@/payments/interfaces";
import { PaymentTransaction } from "@/payments/entities";

import { client } from "../client";
import { chooseCircleBlockchain } from "../blockchain";
import { getCircleWalletIds } from "../services/get-circle-wallet-ids";
import { mapCircleTransactionState } from "../services/map-circle-transaction";
import { pollCircleTransaction } from "../services/poll-circle-transaction";
import { getNativeTokenFor, tokenToCurrency } from "@/payments/values";

export const sendBlockchainTransaction: SendBlockchainTransaction = async ({
  transaction,
  sourceAddress,
  destinationAddress,
  tokenAddress,
  blockchain,
  live,
}) =>
  tryAsync(
    async () => {
      if (!transaction.fingerprint) {
        return {
          payment: {
            ...transaction,
            status: "canceled",
            cancellation_reason: "Transaction is missing a fingerprint",
          },
        };
      }

      const { circleWalletIds } = await getCircleWalletIds({
        wallets: [{ address: sourceAddress, blockchain, locationId: "" }],
        live,
      });

      if (circleWalletIds.length === 0) {
        return {
          payment: {
            ...transaction,
            status: "canceled",
            cancellation_reason:
              "Source address is not associated with a Circle wallet",
          },
        };
      }

      const circleTx = await client.createTransaction({
        walletId: circleWalletIds[0],
        blockchain: chooseCircleBlockchain({
          blockchain,
          live,
        }) as TokenBlockchain,
        amount: [transaction.amount],
        destinationAddress,
        tokenAddress,
        idempotencyKey: transaction.fingerprint,
        refId: transaction.id,
        fee: {
          type: "level",
          config: { feeLevel: "LOW" },
        },
      });

      if (!circleTx.data) {
        throw new Error("Could not create transaction");
      }

      const circleTxWithHash = await pollCircleTransaction({
        circleTxId: circleTx.data.id,
        untilMatch: (circleTx) => !!circleTx.txHash,
      });

      if (!circleTxWithHash || !circleTxWithHash.txHash) {
        throw new Error("Transaction hash is not available");
      }

      const sentTransaction: PaymentTransaction = {
        ...transaction,
        status: mapCircleTransactionState(circleTx.data.state),
        blockchain: {
          hash: circleTxWithHash.txHash,
          counterparty: destinationAddress,
        },
      };

      const feeTransaction: BlockchainTransaction = {
        type: "fee",
        amount: "0",
        currency: tokenToCurrency(getNativeTokenFor({ blockchain })),
        status: "queued",
        fee_type: "network",
        network: "blockchain",
        blockchain: {
          hash: circleTxWithHash.txHash,
        },
        location: transaction.location,
        created_at: new Date(),
      };

      return {
        payment: sentTransaction,
        fee: feeTransaction,
      };
    },
    (error) => {
      console.error((error as any).response.data);
      return {
        type: "BlockchainActionError",
        message: String(error),
        blockchain,
      };
    }
  );
