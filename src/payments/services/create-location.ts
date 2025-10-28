import { ok, Result } from "@/lib";

import {
  Balance,
  Location,
  balanceId,
  loadBalance,
  saveBalancesWithLocation,
  locationId,
} from "@/payments/entities";
import { Blockchain, getCurrenciesForBlockchain } from "@/payments/values";

import { createBlockchainWallet } from "@/circle/adapters";
import { CreateBlockchainWallet } from "@/payments/interfaces";

import { BlockchainActionError } from "@/payments/errors.js";

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
}): Promise<Result<Location, BlockchainActionError>> => {
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
          holdings: [...existingBalance.holdings, newLocation.id],
        };

      return Balance.parse({
        id: balanceId(currency),
        owner: accountId,
        live,
        currency,
        amount: "0",
        holdings: [newLocation.id],
      });
    })
  );

  await saveBalancesWithLocation({
    balances: newBalances,
    location: newLocation,
  });

  return ok(newLocation);
};
