import { z } from "zod";
import { Blockchain } from "./blockchain";

export const PaymentMethodTypeCrypto = z.literal("crypto");
export type PaymentMethodTypeCrypto = z.infer<typeof PaymentMethodTypeCrypto>;

export const PaymentMethodType = z.union([PaymentMethodTypeCrypto]);
export type PaymentMethodType = z.infer<typeof PaymentMethodType>;

export const PaymentMethodCrypto = z.object({
  blockchain: Blockchain,
  address: z.string().min(10),
});
export type PaymentMethodCrypto = z.infer<typeof PaymentMethodCrypto>;

// export const PaymentMethod = z.union([PaymentMethodCrypto]);
// export type PaymentMethod = z.infer<typeof PaymentMethod>;
