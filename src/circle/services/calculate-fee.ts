import Big from "big.js";

export const calculateFee = ({
  gasAmount,
  gasPrice,
  decimals,
}: {
  gasAmount: string | bigint;
  gasPrice: string | bigint;
  decimals: number;
}): string => {
  const amount =
    typeof gasAmount === "bigint" ? gasAmount.toString() : gasAmount;
  const price = typeof gasPrice === "bigint" ? gasPrice.toString() : gasPrice;
  const precisionExponent = Big(10).pow(decimals);

  const fee = Big(amount).mul(price).div(precisionExponent).toFixed(decimals);

  return fee;
};
