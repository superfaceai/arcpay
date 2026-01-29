import { ensureLocation } from "@/balances/services";
import { Currency } from "@/balances/values";
import { getCircleWalletIds } from "@/circle/services/get-circle-wallet-ids";

export const getAccountArcWallet = async ({
  accountId,
  live,
  currency,
}: {
  accountId: string;
  live: boolean;
  currency: Currency;
}) => {
  const locationResult = await ensureLocation({
    accountId,
    live,
    currency,
    preferredBlockchains: ["arc"],
  });

  if (!locationResult.ok) {
    const errorType =
      "type" in locationResult.error
        ? locationResult.error.type
        : "Unknown error";
    throw new Error(`Failed to ensure arc location: ${errorType}`);
  }

  const location = locationResult.value;

  const { circleWalletIds } = await getCircleWalletIds({
    wallets: [
      {
        address: location.address,
        blockchain: location.blockchain,
        locationId: location.id,
      },
    ],
    live,
  });

  const circleWalletId = circleWalletIds[0];

  if (!circleWalletId) {
    throw new Error("No Circle wallet found for the Arc location");
  }

  return {
    circleWalletId,
    location,
  };
};
