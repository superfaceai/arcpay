import Big from "big.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { err, ok, Result } from "@/lib";

import {
  CircleCreateTransactionError,
  CircleFetchBalanceError,
  CircleValidateAddressError,
  createTransaction,
  validateAddress,
} from "@/circle";

import {
  Wallet,
  transactionId,
  Transaction,
  saveTransaction,
} from "@/payments/entities";
import {
  Amount,
  StablecoinToken,
  getStablecoinTokenAddress,
} from "@/payments/values";
import { getWalletBalance } from "@/payments/services";
import {
  PaymentInsufficientBalanceError,
  PaymentUnsupportedTokenError,
  PaymentInvalidAddressError,
} from "@/payments/errors";

export const SendMoneyDTO = z.object({
  to: z.string().min(2),
  amount: Amount,
  currency: StablecoinToken,
});

export const sendMoney = async (
  wallet: Wallet,
  dto: z.infer<typeof SendMoneyDTO>
): Promise<
  Result<
    Transaction,
    | CircleFetchBalanceError
    | PaymentInsufficientBalanceError
    | CircleValidateAddressError
    | PaymentInvalidAddressError
    | PaymentUnsupportedTokenError
    | CircleCreateTransactionError
  >
> => {
  const balance = await getWalletBalance(wallet);

  if (!balance.ok) return balance;

  const currencyBalance = balance.value.available.find(
    (balance) => balance.currency === dto.currency
  );

  if (Big(currencyBalance?.amount ?? "0").lt(Big(dto.amount).abs())) {
    return err({
      type: "PaymentInsufficientBalanceError",
      currency: dto.currency,
      requiredAmount: dto.amount,
      availableAmount: currencyBalance?.amount ?? "0",
    });
  }

  const validation = await validateAddress({
    address: dto.to,
    blockchain: wallet.blockchain,
    live: wallet.live,
  });

  if (!validation.ok) {
    return validation;
  } else if (!validation.value.isValid) {
    return err({
      type: "PaymentInvalidAddressError",
      address: dto.to,
      blockchain: wallet.blockchain,
    });
  }

  const tokenAddress = getStablecoinTokenAddress({
    blockchain: wallet.blockchain,
    token: dto.currency,
    live: wallet.live,
  });

  if (!tokenAddress) {
    return err({
      type: "PaymentUnsupportedTokenError",
      token: dto.currency,
      blockchain: wallet.blockchain,
    });
  }

  // const fees = await estimateFees({
  //   sourceAddress: wallet.address,
  //   destinationAddress: input.to,
  //   tokenAddress,
  //   amount: input.amount,
  //   blockchain: wallet.blockchain,
  //   live: wallet.live,
  // });

  // if (!fees.ok) {
  //   return ProblemJson(
  //     c,
  //     500,
  //     "Issuer Fees Estimation Error",
  //     fees.error.message
  //   );
  // }

  // console.log(fees.value);

  const newTransaction = Transaction.parse({
    id: transactionId(),
    status: "queued",
    amount: dto.amount,
    currency: dto.currency,
    fees: [],
    counterparty: dto.to,
    created_at: new Date(),
    fingerprint: uuidv4(),
  });

  const sentTransaction = await createTransaction({
    transaction: newTransaction,
    sourceWalletId: wallet.circle.id,
    tokenAddress,
    blockchain: wallet.blockchain,
    live: wallet.live,
  });

  if (!sentTransaction.ok) return sentTransaction;

  await saveTransaction({
    transaction: sentTransaction.value,
    walletId: wallet.id,
  });

  return ok(sentTransaction.value);
};
