import { z } from "zod";

import { err, ok, Result } from "@/lib";

import { PaymentMandate, savePaymentMandate } from "@/payments/entities";

import { PaymentMandateInactiveError } from "@/payments/errors";
import { getPaymentMandate } from "./get-payment-mandate";

export const RevokePaymentMandateDTO = z.object({
  mandate_id: z.string(),
});
export type RevokePaymentMandateDTO = z.infer<typeof RevokePaymentMandateDTO>;

export const revokePaymentMandate = async ({
  accountId,
  live,
  idOrSecret,
}: {
  accountId: string;
  live: boolean;
  idOrSecret: string;
}): Promise<Result<PaymentMandate | null, PaymentMandateInactiveError>> => {
  const mandate = await getPaymentMandate({
    accountId,
    idOrSecret,
    live,
  });

  if (!mandate) {
    return ok(null);
  }

  if (mandate.status === "inactive") {
    return err({
      type: "PaymentMandateInactiveError",
      inactiveReason: mandate.inactive_reason,
    });
  }

  const revokedMandate: PaymentMandate = PaymentMandate.parse({
    ...mandate,
    status: "inactive",
    inactive_reason: "revoked",
    revoked_at: new Date(),
  });

  await savePaymentMandate({ paymentMandate: revokedMandate });

  return ok(revokedMandate);
};
