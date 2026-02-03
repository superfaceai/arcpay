import { ensureLocation } from "@/balances/services";
import { Currency } from "@/balances/values";
import { getCircleWalletIds } from "@/circle/services/get-circle-wallet-ids";

export const getAccountArcWallet = async ({
  accountId,
  live,
}: {
  accountId: string;
  live: boolean;
}) => {
  const locationResult = await ensureLocation({
    accountId,
    live,
    currency: "USDC", // TODO add multiple currencies support to ensureLocation
    preferredBlockchains: ["arc"], // Arc is the only supported blockchain for X402 at the moment
  });

  if (!locationResult.ok) {
    const errorType =
      "type" in locationResult.error
        ? locationResult.error.type
        : "Unknown error";
    throw new Error(`Failed to ensure arc location: ${errorType}`);
  }

  const location = locationResult.value;
  const supportedCurrencies: Currency[] = location.assets.map(
    (asset) => asset.currency,
  );

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
    supportedCurrencies,
    location,
  };
};
