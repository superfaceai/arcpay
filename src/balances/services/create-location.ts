import { ok, Result } from "@/lib";

import {
  Balance,
  Location,
  balanceId,
  loadBalance,
  saveBalancesWithLocation,
  locationId,
} from "@/balances/entities";
import { Blockchain, getCurrenciesForBlockchain } from "@/balances/values";

import { createBlockchainWallet } from "@/circle/adapters";
import { CreateBlockchainWallet } from "@/balances/interfaces";

import { BlockchainWalletActionError } from "@/balances/errors";

export const createLocation = async ({
  accountId,
  live,
  blockchain,
  createBlockchainWalletAdapter = createBlockchainWallet,
}: {
  accountId: string;
  live: boolean;
  blockchain: Blockchain;
  createBlockchainWalletAdapter?: CreateBlockchainWallet;
}): Promise<Result<Location, BlockchainWalletActionError>> => {
  const createWalletResult = await createBlockchainWalletAdapter({
    blockchain,
    live,
  });
  if (!createWalletResult.ok) return createWalletResult;

  const currencies = getCurrenciesForBlockchain({ blockchain });

  const newLocation = Location.parse({
    id: locationId(),
    owner: accountId,
    live,
    type: "crypto_wallet",
    address: createWalletResult.value.address,
    blockchain,
    created_at: new Date(),
    assets: currencies.map((currency) => ({
      currency,
      amount: "0",
    })),
  });

  const newBalances: Balance[] = await Promise.all(
    currencies.map(async (currency) => {
      const existingBalance = await loadBalance({ accountId, live, currency });

      if (existingBalance)
        return {
          ...existingBalance,
          locations: [...existingBalance.locations, newLocation.id],
        };

      return Balance.parse({
        id: balanceId(currency),
        owner: accountId,
        live,
        currency,
        amount: "0",
        locations: [newLocation.id],
      });
    })
  );

  await saveBalancesWithLocation({
    balances: newBalances,
    location: newLocation,
  });

  return ok(newLocation);
};
