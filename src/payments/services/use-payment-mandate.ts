import Big from "big.js";

import { Amount, mapAmount } from "@/balances/values";
import { PaymentMandate } from "@/payments/entities";

/**
 * Expects a mandate to be validated and active.
 * Returns a mandate with the amount used and the status updated.
 */
export const useValidPaymentMandate = ({
  amount,
  paymentMandate,
}: {
  amount: Amount;
  paymentMandate: PaymentMandate;
}): PaymentMandate => {
  if (paymentMandate.type === "single_use") {
    return {
      ...paymentMandate,
      single_use: {
        ...paymentMandate.single_use,
        used_amount: mapAmount(amount, { negative: false }),
      },
      status: "inactive",
      inactive_reason: "used",
      used_at: new Date(),
    };
  } else if (paymentMandate.type === "multi_use") {
    const totalUsedAmount = Big(
      paymentMandate.multi_use.total_used_amount ?? "0"
    )
      .abs()
      .add(amount)
      .toString();
    const totalUsedCount = (paymentMandate.multi_use.total_used_count ?? 0) + 1;

    const usedAllAmount = Big(totalUsedAmount).gte(
      Big(paymentMandate.multi_use.amount_limit)
    );
    const usedAllCount = Big(totalUsedCount).gte(
      Big(paymentMandate.multi_use.usage_count_limit ?? 0)
    );
    const isFinished = usedAllCount || usedAllAmount;

    return {
      ...paymentMandate,
      multi_use: {
        ...paymentMandate.multi_use,
        total_used_amount: totalUsedAmount,
        total_used_count: totalUsedCount,
      },
      status: isFinished ? "inactive" : "active",
      used_at: new Date(),
      ...(isFinished
        ? {
            inactive_reason: "used",
          }
        : {}),
    };
  }

  throw new Error("never");
};
