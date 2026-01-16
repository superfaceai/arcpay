import { getPaymentHandlerObject } from "@/ucp-payment-handler/services";
import { PlatformProfile } from "@/ucp/interfaces";

export const ArcPayPlatformProfilePath =
  "/ucp/profiles/arcpay-shopping-agent.json";

export const getArcPayPlatformProfileURL = (baseUrl: string) =>
  new URL(ArcPayPlatformProfilePath, baseUrl).toString();

export const getArcPayPlatformProfile = ({
  baseUrl,
}: {
  baseUrl: string;
}): PlatformProfile => ({
  ucp: {
    version: "2026-01-11",
    capabilities: [
      {
        name: "dev.ucp.shopping.checkout",
        version: "2026-01-11",
        spec: "https://ucp.dev/specification/checkout",
        schema: "https://ucp.dev/schemas/shopping/checkout.json",
      },
      {
        name: "dev.ucp.shopping.fulfillment",
        version: "2026-01-11",
        spec: "https://ucp.dev/specification/fulfillment",
        schema: "https://ucp.dev/schemas/shopping/fulfillment.json",
        extends: "dev.ucp.shopping.checkout",
      },
    ],
  },
  payment: {
    handlers: [
      getPaymentHandlerObject({
        hostUrl: baseUrl,
        handlerId: "arcpay",
      }),
    ],
  },
  // TODO: Add signing keys
  signing_keys: [
    {
      kid: "platform_2026",
      kty: "EC",
      crv: "P-256",
      x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      y: "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      use: "sig",
      alg: "ES256",
    },
  ],
});
