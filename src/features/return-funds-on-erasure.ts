import Config from "@/config";
import { StablecoinToken } from "@/balances/values";

const isEnabled = () =>
  Config.FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_ENABLED &&
  !!Config.FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_BLOCKCHAIN &&
  !!Config.FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_ADDRESS;

export const ReturnFundsOnErasureFeature = {
  isEnabled,
  getReturnFundsOnErasureSettings: () => {
    return {
      currency: "USDC" as StablecoinToken,
      blockchain: Config.FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_BLOCKCHAIN!,
      address: Config.FEATURE_RETURN_FUNDS_ON_ACCOUNT_DELETION_ADDRESS!,
    };
  },
};
