import { z } from "zod";
import { Blockchain } from "@/balances/values";
import { AccountHandle } from "@/identity/entities";

export const PaymentMethodTypeCrypto = z.literal("crypto");
export type PaymentMethodTypeCrypto = z.infer<typeof PaymentMethodTypeCrypto>;

export const PaymentMethodTypeAgentPay = z.literal("agent_pay");
export type PaymentMethodTypeAgentPay = z.infer<
  typeof PaymentMethodTypeAgentPay
>;

export const PaymentMethodType = z.union([
  PaymentMethodTypeCrypto,
  PaymentMethodTypeAgentPay,
]);
export type PaymentMethodType = z.infer<typeof PaymentMethodType>;

export const PaymentMethodCrypto = z.object({
  blockchain: Blockchain,
  address: z.string().min(10),
});
export type PaymentMethodCrypto = z.infer<typeof PaymentMethodCrypto>;

export const PaymentMethodAgentPay = z.object({
  account: AccountHandle,
});
export type PaymentMethodAgentPay = z.infer<typeof PaymentMethodAgentPay>;

// export const PaymentMethod = z.union([PaymentMethodCrypto]);
// export type PaymentMethod = z.infer<typeof PaymentMethod>;
