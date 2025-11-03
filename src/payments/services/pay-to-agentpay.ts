import { z } from "zod";

import { err, Result } from "@/lib";

import { Amount, StablecoinToken } from "@/balances/values";

import { Payment } from "@/payments/entities";
import {
  PaymentMethodTypeAgentPay,
  PaymentMethodAgentPay,
} from "@/payments/values";
import { PaymentUnsupportedPaymentMethodError } from "@/payments/errors";

export const PayToAgentPayDTO = z.object({
  amount: Amount,
  currency: StablecoinToken,
  method: PaymentMethodTypeAgentPay,
  agent_pay: PaymentMethodAgentPay,
});

export const payToAgentPay = async ({
  accountId,
  live,
  dto,
}: {
  accountId: string;
  live: boolean;
  dto: z.infer<typeof PayToAgentPayDTO>;
}): Promise<Result<Payment, PaymentUnsupportedPaymentMethodError>> => {
  return err({
    type: "PaymentUnsupportedPaymentMethodError",
    method: dto.method,
  });
};
