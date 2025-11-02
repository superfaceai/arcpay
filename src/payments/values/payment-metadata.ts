import { z } from "zod";

export const PaymentMetadata = z.record(z.string(), z.string());
export type PaymentMetadata = z.infer<typeof PaymentMetadata>;
