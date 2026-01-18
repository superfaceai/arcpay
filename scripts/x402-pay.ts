// import {  } from "@x402/evm";
import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { Config } from "@/config";

import { AxiosError, isAxiosError } from "axios";

import {
  wrapFetchWithPaymentFromConfig,
  decodePaymentResponseHeader,
} from "@x402/fetch";
import { ClientEvmSigner, ExactEvmScheme, toClientEvmSigner } from "@x402/evm";

const MY_FUNDED_WALLET_ID = "ddcdfb7d-384c-574f-93a0-1f32ee710b57";
const SECOND_WALLET_ID = "4334794d-c236-55ef-a620-4eeb0ac6d786";

const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: Config.CIRCLE_API_KEY,
  entitySecret: Config.CIRCLE_ENTITY_SECRET,
});

const listWallets = async () => {
  const wallets = await circleClient.listWallets();
  console.log(
    "Wallets: ",
    wallets.data?.wallets
      ?.map(({ id, address }) => `(${id}): ${address}`)
      .join("\n")
  );
};

await listWallets();

const printBalance = async (id: string) => {
  const balance = await circleClient.getWalletTokenBalance({
    id,
  });
  console.log(
    `Balance ${id}: `,
    balance.data?.tokenBalances
      ?.map(({ token, amount }) => `${token.name} ${amount}`)
      .join(", ")
  );
};

await printBalance(SECOND_WALLET_ID);

// Setup x402 with ARC
const createArcClientSigner = async (id: string): Promise<ClientEvmSigner> => {
  const wallet = await circleClient.getWallet({ id });

  return {
    address: wallet.data?.wallet?.address as `0x${string}`,

    signTypedData: async (message) => {
      console.log("Signing message: ");
      console.dir(message, { depth: null });

      // Circle requires EIP712Domain to be explicitly in types
      const typesWithDomain = {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        ...message.types,
      };

      const dataToSign = {
        ...message,
        types: typesWithDomain,
      };

      try {
        const signature = await circleClient.signTypedData({
          walletId: id,
          data: JSON.stringify(dataToSign, (_, value) =>
            typeof value === "bigint" ? value.toString() : value
          ),
        });

        return signature.data?.signature as `0x${string}`;
      } catch (error) {
        if (isAxiosError(error)) {
          console.error("Error during signing: ", error.response?.data);
          throw error;
        } else {
          console.error("Unknown error during signing: ");
          throw error;
        }
      }
    },
  };
};

// Usage in your script
const signer = await createArcClientSigner(SECOND_WALLET_ID);
const scheme = new ExactEvmScheme(signer);

const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
  schemes: [
    {
      network: "eip155:5042002",
      client: scheme,
    },
  ],
});

// Make a paid request

try {
  console.log("Making paid request...");

  const response = await fetchWithPayment(
    "http://localhost:3003/buy-me-a-coffee",
    {
      method: "POST",
    }
  );

  console.log("Response status:", response.status);

  const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
  if (paymentResponse) {
    const decoded = decodePaymentResponseHeader(paymentResponse);
    console.log("Payment details:", decoded);
  }

  const responseBody = await response.text();
  console.log("Response body:", responseBody);
} catch (error) {
  console.error("Error during fetch:");
  console.error(error);
  throw error;
}

await printBalance(SECOND_WALLET_ID);
