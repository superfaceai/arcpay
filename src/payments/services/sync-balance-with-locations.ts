import Big from "big.js";

import { Balance, Location } from "@/payments/entities";

export const syncBalanceWithLocations = ({
  balance,
  locations,
}: {
  balance: Balance;
  locations: Location[];
}): { balance: Balance; changed: boolean } => {
  let currencyTotal = Big(0);

  for (const location of locations) {
    for (const locationAsset of location.assets) {
      if (locationAsset.currency === balance.currency) {
        currencyTotal = currencyTotal.plus(Big(locationAsset.amount));
      }
    }
  }

  const newBalance: Balance = {
    ...balance,
    amount: currencyTotal.toString(),
  };

  return {
    balance: newBalance,
    changed: newBalance.amount !== balance.amount,
  };
};
