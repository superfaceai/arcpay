import Config from "@/config";
import { tryAsync } from "@/lib";
import { CreateBlockchainWallet } from "@/balances/interfaces";

import { client } from "../client";
import { chooseCircleBlockchain } from "../blockchain";

export const createBlockchainWallet: CreateBlockchainWallet = async ({
  blockchain,
  live,
}) =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      const walletsResponse = await client.createWallets({
        blockchains: [chain],
        walletSetId: Config.CIRCLE_WALLETSET_ID,
        accountType: "EOA",
        count: 1,
      });

      if (
        !walletsResponse.data?.wallets ||
        walletsResponse.data.wallets.length === 0
      ) {
        throw new Error("Could not create wallet on the blockchain");
      }

      return { address: walletsResponse.data.wallets[0].address };
    },
    (error) => ({
      type: "BlockchainWalletActionError",
      message: String(error),
      blockchain,
    })
  );
