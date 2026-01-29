import type { ClientEvmSigner } from "@x402/evm";

import { client } from "@/circle/client";

const EIP712_DOMAIN_TYPES = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
];

export const createArcClientSigner = async (
  walletId: string,
): Promise<ClientEvmSigner> => {
  const wallet = await client.getWallet({ id: walletId });
  const address = wallet.data?.wallet?.address;

  if (!address) {
    throw new Error("Circle wallet address not found");
  }

  return {
    address: address as `0x${string}`,
    signTypedData: async (message) => {
      const typesWithDomain = {
        EIP712Domain: EIP712_DOMAIN_TYPES,
        ...message.types,
      };

      const dataToSign = {
        ...message,
        types: typesWithDomain,
      };

      const signature = await client.signTypedData({
        walletId,
        data: JSON.stringify(dataToSign, (_, value) =>
          typeof value === "bigint" ? value.toString() : value,
        ),
      });

      const signed = signature.data?.signature;
      if (!signed) {
        throw new Error("Failed to sign payment authorization");
      }

      return signed as `0x${string}`;
    },
  };
};
