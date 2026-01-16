import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { loadAccountById } from "@/identity/entities";
import { createCheckoutSession } from "@/ucp-checkouts/adapters";
import {
  mapCheckoutResponse,
  mapAddressToUCP,
  chooseShippingAddress,
  mapBuyerContact,
} from "@/ucp-checkouts/services";
import {
  CheckoutCreateRequest,
  ShippingDestinationRequest,
  FulfillmentRequest,
} from "@/ucp/interfaces";
import { getArcPayPlatformProfileURL } from "@/ucp-checkouts/values/profile";

const inputSchema = {
  ucpBaseUrl: z.string().url().describe("The base URL of the Merchant UCP"),
  products: z
    .array(
      z.object({
        id: z.string().describe("The product ID, or variant ID"),
        quantity: z
          .number()
          .int()
          .positive()
          .describe("The quantity of the product"),
      })
    )
    .describe("The products to add to the cart"),
  fulfillmentAddressId: z
    .string()
    .optional()
    .describe("The fulfillment address ID to use for the checkout"),
  currency: z.string().describe("The currency code (e.g., 'usd')"),
};
const outputSchema = { checkout: z.unknown().describe("Current cart state") };

export const addToNewCartTool = createMcpTool(
  "add-to-new-cart",
  {
    title: "Add to New Cart",
    description: "Add products into a new checkout session",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({ ucpBaseUrl, products, fulfillmentAddressId, currency }) => {
      try {
        const profileUrl = getArcPayPlatformProfileURL(context.hostUrl);

        const account = (await loadAccountById(context.accountId))!;

        const shippingAddressChoice = chooseShippingAddress({
          addresses: account.addresses,
          fulfillmentAddressId,
        });

        if (shippingAddressChoice.type === "error") {
          return toolResponse({ error: shippingAddressChoice.error });
        }

        const shippingAddress = shippingAddressChoice.address;

        const ucpAddress = mapAddressToUCP(shippingAddress);
        const shippingDestination: ShippingDestinationRequest = {
          ...ucpAddress,
        };

        const fulfillment: FulfillmentRequest | undefined = shippingAddress
          ? {
              methods: [
                {
                  type: "shipping",
                  destinations: [shippingDestination],
                },
              ],
            }
          : undefined;

        const buyer = mapBuyerContact(account);

        const request: CheckoutCreateRequest & {
          fulfillment?: FulfillmentRequest;
        } = {
          line_items: products.map((p) => ({
            item: { id: p.id },
            quantity: p.quantity,
          })),
          currency: currency.toLowerCase(),
          payment: {},
          ...(buyer ? { buyer } : {}),
          ...(fulfillment ? { fulfillment } : {}),
        };

        const cartResult = await createCheckoutSession({
          ucpUrl: ucpBaseUrl,
          profileUrl,
          request,
        });

        if (!cartResult.ok) {
          if (cartResult.error.type === "UCPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(cartResult.error.error),
            });
          }

          return toolResponse({
            error: cartResult.error.message ?? "Unknown error",
          });
        }

        const publicCheckoutResult = mapCheckoutResponse(cartResult.value, {
          id: shippingAddress.id,
          label: shippingAddress.label,
        });
        if (publicCheckoutResult.type === "error") {
          return toolResponse({ error: publicCheckoutResult.error });
        }

        return toolResponse({
          structuredContent: {
            checkout: publicCheckoutResult.checkout,
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
