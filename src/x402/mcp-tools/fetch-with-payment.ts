import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import {
  decodePaymentResponseHeader,
  x402Client,
  x402HTTPClient,
} from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

import {
  createArcClientSigner,
  getAccountArcWallet,
  recordX402Payment,
} from "@/x402/services";

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
  mandateSecret: z
    .string()
    .optional()
    .describe("Optional Arc Pay payment mandate secret token"),
};

const outputSchema = {
  status: z.number().describe("HTTP response status"),
  headers: z.record(z.string()).describe("Response headers"),
  body: z.string().describe("Response body as text"),
  paymentDetails: z.record(z.any()).optional(),
  arcPay: z
    .object({
      paymentId: z.string(),
      transactionId: z.string(),
      transactionHash: z.string(),
      mandateId: z.string().optional(),
    })
    .optional(),
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
    async ({ url, method, headers, body, mandateSecret }) => {
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

        const client = x402Client.fromConfig({
          schemes: [
            {
              network,
              client: scheme,
            },
          ],
        });
        const httpClient = new x402HTTPClient(client);

        const request = new Request(url, {
          method: method ?? "GET",
          headers,
          ...(body ? { body } : {}),
        });
        const paidRequest = request.clone();

        const initialResponse = await fetch(request);

        if (initialResponse.status !== 402) {
          return toolResponse({
            structuredContent: {
              status: initialResponse.status,
              headers: Object.fromEntries(initialResponse.headers.entries()),
              body: await initialResponse.text(),
            },
          });
        }

        let paymentRequired;
        try {
          const getHeader = (name: string) => initialResponse.headers.get(name);
          let responseBody: unknown = undefined;

          try {
            const responseText = await initialResponse.clone().text();
            if (responseText) {
              responseBody = JSON.parse(responseText);
            }
          } catch {
            responseBody = undefined;
          }

          paymentRequired = httpClient.getPaymentRequiredResponse(
            getHeader,
            responseBody
          );
        } catch (error) {
          throw new Error(
            `Failed to parse payment requirements: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }

        const paymentPayload = await client.createPaymentPayload(paymentRequired);
        const paymentHeaders = httpClient.encodePaymentSignatureHeader(
          paymentPayload
        );

        for (const [key, value] of Object.entries(paymentHeaders)) {
          paidRequest.headers.set(key, value);
        }
        paidRequest.headers.set(
          "Access-Control-Expose-Headers",
          "PAYMENT-RESPONSE,X-PAYMENT-RESPONSE"
        );

        const paidResponse = await fetch(paidRequest);

        const paymentResponseHeader =
          paidResponse.headers.get("PAYMENT-RESPONSE") ??
          paidResponse.headers.get("X-PAYMENT-RESPONSE");
        const paymentDetails = paymentResponseHeader
          ? jsonSafe(decodePaymentResponseHeader(paymentResponseHeader))
          : undefined;

        let arcPayDetails:
          | {
              paymentId: string;
              transactionId: string;
              transactionHash: string;
              mandateId?: string;
            }
          | undefined = undefined;

        if (paymentDetails) {
          const recordResult = await recordX402Payment({
            accountId: context.accountId,
            live: context.live,
            paymentPayload,
            settlement: paymentDetails,
            mandateSecret,
          });

          if (!recordResult.ok) {
            if (mandateSecret) {
              return toolResponse({ error: recordResult.error.message });
            }

            console.error("x402 payment record failed", recordResult.error);
          } else {
            arcPayDetails = {
              paymentId: recordResult.value.payment.id,
              transactionId: recordResult.value.transaction.id,
              transactionHash: recordResult.value.transaction.blockchain.hash,
              ...(recordResult.value.mandate
                ? { mandateId: recordResult.value.mandate.id }
                : {}),
            };
          }
        }

        return toolResponse({
          structuredContent: {
            status: paidResponse.status,
            headers: Object.fromEntries(paidResponse.headers.entries()),
            body: await paidResponse.text(),
            ...(paymentDetails ? { paymentDetails } : {}),
            ...(arcPayDetails ? { arcPay: arcPayDetails } : {}),
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
