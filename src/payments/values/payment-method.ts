import { z } from "zod";
import { Blockchain } from "@/balances/values";
import { AccountHandle } from "@/identity/entities";

export const PaymentMethodTypeCrypto = z.literal("crypto");
export type PaymentMethodTypeCrypto = z.infer<typeof PaymentMethodTypeCrypto>;

export const PaymentMethodTypeArcPay = z.literal("arc_pay");
export type PaymentMethodTypeArcPay = z.infer<
  typeof PaymentMethodTypeArcPay
>;

export const PaymentMethodType = z.union([
  PaymentMethodTypeCrypto,
  PaymentMethodTypeArcPay,
]);
export type PaymentMethodType = z.infer<typeof PaymentMethodType>;

export const PaymentMethodCrypto = z.object({
  blockchain: Blockchain,
  address: z.string().min(10),
});
export type PaymentMethodCrypto = z.infer<typeof PaymentMethodCrypto>;

export const PaymentMethodArcPay = z.object({
  account: AccountHandle,
});
export type PaymentMethodArcPay = z.infer<typeof PaymentMethodArcPay>;

// export const PaymentMethod = z.union([PaymentMethodCrypto]);
// export type PaymentMethod = z.infer<typeof PaymentMethod>;
