import { z } from "zod";

import { DateCodec, ok, Result } from "@/lib";
import {
  PaymentMandate,
  loadPaymentMandatesByAccount,
  saveManyPaymentMandates,
} from "@/payments/entities";

export const ListPaymentMandatesDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const listPaymentMandates = async ({
  dto,
  accountId,
  live,
}: {
  dto: z.infer<typeof ListPaymentMandatesDTO>;
  accountId: string;
  live: boolean;
}): Promise<Result<PaymentMandate[], any>> => {
  const dbPaymentMandates = await loadPaymentMandatesByAccount({
    accountId,
    live,
    from: dto.from,
    to: dto.to,
  });

  if (dbPaymentMandates.length === 0) return ok([]);

  const mandatesToUpdate: PaymentMandate[] = [];

  for (const mandate of dbPaymentMandates) {
    if (
      mandate.status === "active" &&
      mandate.expires_at &&
      mandate.expires_at < new Date()
    ) {
      mandatesToUpdate.push({
        ...mandate,
        status: "inactive",
        inactive_reason: "expired",
      });
    }
  }

  if (mandatesToUpdate.length > 0) {
    await saveManyPaymentMandates({ paymentMandates: mandatesToUpdate });
  }

  return ok(dbPaymentMandates);
};
