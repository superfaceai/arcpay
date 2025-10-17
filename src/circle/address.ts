import { Result, tryAsync } from "@/lib/index.js";

import { CircleValidateAddressError } from "./errors.js";
import { Blockchain } from "@/payments/values/index.js";

import { client } from "./client.js";
import { chooseCircleBlockchain } from "./blockchain.js";

export const validateAddress = async ({
  address,
  blockchain,
  live,
}: {
  address: string;
  blockchain: Blockchain;
  live: boolean;
}): Promise<Result<{ isValid: boolean }, CircleValidateAddressError>> =>
  tryAsync(
    async () => {
      const chain = chooseCircleBlockchain({ blockchain, live });

      const validation = await client.validateAddress({
        address,
        blockchain: chain,
      });

      if (!validation.data) {
        throw new Error("Received invalid response from Circle");
      }

      return { isValid: validation.data.isValid };
    },
    (error) => ({
      type: "CircleValidateAddressError",
      message: String(error),
    })
  );
