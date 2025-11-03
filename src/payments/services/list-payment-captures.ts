import { z } from "zod";

import { DateCodec, ok, Result } from "@/lib";
import {
  PaymentCapture,
  loadPaymentCapturesByAccount,
} from "@/payments/entities";

export const ListPaymentCapturesDTO = z.object({
  from: DateCodec.optional(),
  to: DateCodec.optional(),
});

export const listPaymentCaptures = async ({
  dto,
  accountId,
  live,
}: {
  dto: z.infer<typeof ListPaymentCapturesDTO>;
  accountId: string;
  live: boolean;
}): Promise<Result<PaymentCapture[], any>> => {
  const dbPaymentCaptures = await loadPaymentCapturesByAccount({
    accountId,
    live,
    from: dto.from,
    to: dto.to,
  });

  return ok(dbPaymentCaptures);
};
