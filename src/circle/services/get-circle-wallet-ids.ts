import { Blockchain } from "@/payments/values";

import { client } from "../client";
import { chooseCircleBlockchain } from "../blockchain";

export const getCircleWalletIds = async ({
  wallets,
  live,
}: {
  wallets: { address: string; blockchain: Blockchain; locationId: string }[];
  live: boolean;
}): Promise<{
  circleWalletIds: string[];
  walletIdToLocation: Record<string, string>;
}> => {
  const circleWalletsRequests = wallets.map(async (wallet) =>
    client.listWallets({
      address: wallet.address,
      blockchain: chooseCircleBlockchain({
        blockchain: wallet.blockchain,
        live,
      }),
    })
  );

  const circleWalletsResponses = await Promise.all(circleWalletsRequests);

  const walletIdToLocation: Record<string, string> = {};
  const circleWalletIds: string[] = [];

  circleWalletsResponses.forEach((response, index) => {
    const circleWalletId = response.data?.wallets?.[0]?.id;
    if (circleWalletId) {
      circleWalletIds.push(circleWalletId);
      walletIdToLocation[circleWalletId] = wallets[index].locationId;
    }
  });

  return {
    circleWalletIds,
    walletIdToLocation,
  };
};
