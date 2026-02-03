import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";
import { getStablecoinTokenAddress, StablecoinToken } from "@/balances/values";

import {
  wrapFetchWithPaymentFromConfig,
  decodePaymentResponseHeader,
  type SelectPaymentRequirements,
} from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

import { createArcClientSigner, getAccountArcWallet } from "@/x402/services";

const ARC_TESTNET_NETWORK = "eip155:5042002";
const ARC_MAINNET_NETWORK = "eip155:5042002"; // mainnet not available yet

const inputSchema = {
  url: z.string().url().describe("The URL to fetch with x402 payment"),
  method: z
    .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
    .optional()
    .describe("HTTP method"),
  headers: z.record(z.string()).optional().describe("Optional HTTP headers"),
  body: z.string().optional().describe("Optional request body"),
};

const outputSchema = {
  status: z.number().describe("HTTP response status"),
  headers: z.record(z.string()).describe("Response headers"),
  body: z.string().describe("Response body as text"),
  paymentDetails: z.record(z.any()).optional(),
};

const jsonSafe = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );

export const fetchWithPaymentTool = createMcpTool(
  "fetch-with-payment",
  {
    title: "Fetch with x402 Payment",
    description: "Perform an HTTP request and pay with x402 Exact scheme",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({ url, method, headers, body }) => {
      try {
        const network = context.live
          ? ARC_MAINNET_NETWORK
          : ARC_TESTNET_NETWORK;

        const { circleWalletId } = await getAccountArcWallet({
          accountId: context.accountId,
          live: context.live,
        });

        const signer = await createArcClientSigner(circleWalletId);
        const scheme = new ExactEvmScheme(signer);

        const fetchWithPayment = wrapFetchWithPaymentFromConfig(fetch, {
          schemes: [
            {
              network,
              client: scheme,
            },
          ],
        });

        const response = await fetchWithPayment(url, {
          method: method ?? "GET",
          headers,
          ...(body ? { body } : {}),
        });

        const paymentResponse = response.headers.get("PAYMENT-RESPONSE");
        const paymentDetails = paymentResponse
          ? jsonSafe(decodePaymentResponseHeader(paymentResponse))
          : undefined;

        return toolResponse({
          structuredContent: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text(),
            ...(paymentDetails ? { paymentDetails } : {}),
          },
        });
      } catch (error) {
        console.error("fetch-with-payment error", error);

        return toolResponse({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },
);
