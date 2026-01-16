import { z } from "zod-v3";

import { createMcpTool, toolResponse } from "@/mcp/services";

import { updateCheckoutSession } from "@/ucp-checkouts/adapters";
import { Address, loadAccountById } from "@/identity/entities";
import {
  chooseShippingAddress,
  mapAddressToUCP,
  mapCheckoutResponse,
  mapBuyerContact,
} from "../services";
import {
  CheckoutUpdateRequest,
  ShippingDestinationRequest,
  FulfillmentRequest,
} from "@/ucp/interfaces";
import { getArcPayPlatformProfileURL } from "@/ucp-checkouts/values/profile";

const inputSchema = {
  ucpBaseUrl: z.string().url().describe("The base URL of the Merchant UCP"),
  checkoutId: z.string().describe("The checkout session ID"),
  fulfillmentOptionId: z
    .string()
    .optional()
    .describe(
      "The fulfillment option ID to select for the checkout to override the default fulfillment option"
    ),
  fulfillmentAddressId: z
    .string()
    .optional()
    .describe("The fulfillment address ID to use for the checkout"),
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
    .describe("The products to hold in the cart."),
  currency: z.string().describe("The currency code (e.g., 'usd')"),
};
const outputSchema = {
  checkout: z.unknown().describe("Current checkout state"),
};

export const updateCheckoutTool = createMcpTool(
  "update-checkout",
  {
    title: "Update Checkout",
    description:
      "Update the quantity of products in a checkout, or add products to a checkout",
    inputSchema,
    outputSchema,
  },
  (context) =>
    async ({
      ucpBaseUrl,
      checkoutId,
      fulfillmentOptionId,
      products,
      fulfillmentAddressId,
      currency,
    }) => {
      try {
        const profileUrl = getArcPayPlatformProfileURL(context.hostUrl);

        const account = (await loadAccountById(context.accountId))!;

        let newFulfillmentAddress: Address | undefined;
        let fulfillment: FulfillmentRequest | undefined;
        if (fulfillmentAddressId) {
          const shippingAddressChoice = chooseShippingAddress({
            addresses: account.addresses,
            fulfillmentAddressId,
          });
          if (shippingAddressChoice.type === "error") {
            return toolResponse({ error: shippingAddressChoice.error });
          }
          newFulfillmentAddress = shippingAddressChoice.address;
          const ucpAddress = mapAddressToUCP(newFulfillmentAddress);
          const shippingDestination: ShippingDestinationRequest = {
            ...ucpAddress,
          };
          fulfillment = {
            methods: [
              {
                type: "shipping",
                destinations: [shippingDestination],
                ...(fulfillmentOptionId
                  ? {
                      groups: [
                        {
                          selected_option_id: fulfillmentOptionId,
                        },
                      ],
                    }
                  : {}),
              },
            ],
          };
        }

        const buyer = mapBuyerContact(account);

        const request: CheckoutUpdateRequest & {
          fulfillment?: FulfillmentRequest;
        } = {
          id: checkoutId,
          line_items: products.map((p) => ({
            item: { id: p.id },
            quantity: p.quantity,
          })),
          currency: currency.toLowerCase(),
          payment: {},
          ...(buyer ? { buyer } : {}),
          ...(fulfillment ? { fulfillment } : {}),
        };

        const checkoutResult = await updateCheckoutSession({
          ucpUrl: ucpBaseUrl,
          profileUrl,
          checkoutSessionId: checkoutId,
          request,
        });

        if (!checkoutResult.ok) {
          if (checkoutResult.error.type === "UCPErrorResponse") {
            return toolResponse({
              error: JSON.stringify(checkoutResult.error.error),
            });
          }

          return toolResponse({
            error: checkoutResult.error.message ?? "Unknown error",
          });
        }

        const publicCheckoutResult = mapCheckoutResponse(checkoutResult.value, {
          addresses: account.addresses,
        });
        if (publicCheckoutResult.type === "error") {
          return toolResponse({ error: publicCheckoutResult.error });
        }

        const { id, ...checkoutWithoutId } = publicCheckoutResult.checkout;
        return toolResponse({
          structuredContent: {
            checkout: {
              ...checkoutWithoutId,
              checkoutId: id,
            },
          },
        });
      } catch (e) {
        console.error(e);
        return toolResponse({ error: "Internal error" });
      }
    }
);
