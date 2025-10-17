import { ok, Result } from "@/lib/index.js";

import { eraseUser, eraseApiKeysForUser } from "@/identity/entities/index.js";
import {
  loadWalletsByUser,
  eraseWalletsForUser,
  eraseTransactionsForWallet,
  eraseDepositsForWallet,
} from "@/payments/entities/index.js";

export const erase = async ({
  userId,
}: {
  userId: string;
}): Promise<Result<void, void>> => {
  const liveWallets = await loadWalletsByUser({ userId, live: false });
  const testWallets = await loadWalletsByUser({ userId, live: true });

  for (const wallet of [...liveWallets, ...testWallets]) {
    await eraseTransactionsForWallet({ walletId: wallet.id });
    await eraseDepositsForWallet({ walletId: wallet.id });
  }

  await eraseWalletsForUser({ userId });
  await eraseUser({ userId });
  await eraseApiKeysForUser({ userId });

  return ok();
};
