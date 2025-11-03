import { z } from "zod";
import Big from "big.js";

import { DateCodec, err, ok, Result } from "@/lib";

import { Amount, Currency } from "@/balances/values";
import { getBalance } from "@/balances/services";
import { BlockchainWalletActionError } from "@/balances/errors";

import { PaymentMetadata, PaymentMethodType } from "@/payments/values";
import {
  PaymentMandate,
  paymentMandateId,
  paymentMandateSecret,
  savePaymentMandate,
} from "@/payments/entities";

import {
  PaymentInsufficientBalanceError,
  PaymentUnsupportedPaymentMethodError,
  PaymentMandateExpiredError,
} from "@/payments/errors";

export const DelegatePaymentDTO = z.object({
  type: z.literal("single_use"),
  single_use: z.object({
    amount_limit: Amount,
    currency: Currency,
  }),
  method: PaymentMethodType,
  merchant_id: z.string().optional(),
  expires_at: DateCodec.optional(),
  metadata: PaymentMetadata,
});
export type DelegatePaymentDTO = z.infer<typeof DelegatePaymentDTO>;

export const delegatePayment = async ({
  accountId,
  live,
  dto,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof DelegatePaymentDTO>;
}): Promise<
  Result<
    PaymentMandate,
    | PaymentUnsupportedPaymentMethodError
    | PaymentMandateExpiredError
    | PaymentInsufficientBalanceError
    | BlockchainWalletActionError
  >
> => {
  if (dto.method !== "agent_pay")
    return err({
      type: "PaymentUnsupportedPaymentMethodError",
      method: dto.method,
    });

  if (dto.expires_at && new Date(dto.expires_at).getTime() < Date.now()) {
    return err({
      type: "PaymentMandateExpiredError",
      expiredAt: new Date(dto.expires_at),
    });
  }

  const balanceResult = await getBalance({
    accountId,
    live,
    currency: dto.single_use.currency,
  });

  if (!balanceResult.ok) return balanceResult;

  if (
    !balanceResult.value ||
    Big(balanceResult.value?.amount ?? "0").lt(
      Big(dto.single_use.amount_limit).abs()
    )
  ) {
    return err({
      type: "PaymentInsufficientBalanceError",
      currency: dto.single_use.currency,
      requiredAmount: dto.single_use.amount_limit,
      availableAmount: balanceResult.value?.amount ?? "0",
      reason: "no_balance",
    });
  }

  const mandateId = paymentMandateId();

  const paymentMandate: PaymentMandate = PaymentMandate.parse({
    id: mandateId,
    type: dto.type,
    live: live,
    status: "active",
    method: dto.method,
    single_use: dto.single_use,
    secret: paymentMandateSecret(mandateId),
    on_behalf_of: accountId,
    created_at: new Date(),
    ...(dto.expires_at ? { expires_at: dto.expires_at } : {}),
    ...(dto.merchant_id ? { merchant_id: dto.merchant_id } : {}),
    metadata: dto.metadata,
  });

  await savePaymentMandate({ paymentMandate });

  return ok(paymentMandate);
};
