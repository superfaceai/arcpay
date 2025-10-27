import { tryAsync } from "@/lib";

import { Blockchain } from "@/payments/values";
import { ValidateBlockchainAddress } from "@/payments/interfaces";

import { client } from "../client.js";
import { chooseCircleBlockchain } from "../blockchain.js";

export const validateBlockchainAddress: ValidateBlockchainAddress = async ({
  address,
  blockchain,
  live,
}: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
}) =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      const validation = await client.validateAddress({
        address,
        blockchain: chain,
      });

      if (!validation.data) {
        throw new Error("Received invalid response from Circle API");
      }

      return { isValid: validation.data.isValid };
    },
    (error) => ({
      type: "BlockchainActionError",
      message: String(error),
      blockchain,
    })
  );
