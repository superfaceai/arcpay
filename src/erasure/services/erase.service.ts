import { ok, Result } from "@/lib";

import { eraseCallsForUser } from "@/api/entities/call.db";
import { eraseUser, eraseApiKeysForUser } from "@/identity/entities";
import {
  loadWalletsByUser,
  eraseWalletsForUser,
  eraseTransactionsForWallet,
  eraseDepositsForWallet,
} from "@/payments/entities";

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

  await eraseCallsForUser({ userId });
  await eraseWalletsForUser({ userId });
  await eraseUser({ userId });
  await eraseApiKeysForUser({ userId });

  return ok();
};
