import cc from "currency-codes";

import { Amount, Currency } from "@/balances/values";
import { err, ok, Result } from "@/lib";
import { PaymentUnsupportedCurrencyError } from "@/payments/errors";
import Big from "big.js";

export const mapCurrencyAmount = ({
  amount,
  currency,
}: {
  amount: number;
  currency: string;
}): Result<
  { amount: Amount; currency: Currency },
  PaymentUnsupportedCurrencyError
> => {
  const currencyInfo = cc.code(currency.toUpperCase());

  if (!currencyInfo) {
    return err({
      type: "PaymentUnsupportedCurrencyError",
      currency,
    });
  }

  const coercedCurrency = coerceCurrency[currencyInfo.code.toLowerCase()];

  if (!coercedCurrency) {
    return err({
      type: "PaymentUnsupportedCurrencyError",
      currency,
    });
  }

  const precisionExponent = Big(10).pow(currencyInfo.digits);

  return ok({
    amount: Big(amount).div(precisionExponent).toString(),
    currency: coercedCurrency,
  });
};

const coerceCurrency: { [key: string]: Currency | undefined } = {
  usd: "USDC",
  eur: "EURC",
};
