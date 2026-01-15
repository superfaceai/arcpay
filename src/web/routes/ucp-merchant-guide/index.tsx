import { createWebRoute, isLoggedIn } from "@/web/services";

import { UcpMerchantGuide } from "./UcpMerchantGuide";

export const ucpMerchantGuideRoute = createWebRoute().get(
  "/ucp/guides/arcpay-payment-handler",
  async (c) => {
    const host = new URL(c.req.url);
    const loggedIn = await isLoggedIn(c);
    return c.html(
      <UcpMerchantGuide
        host={host.origin}
        thisPageUrl={c.req.url.split("?")[0]}
        isLoggedIn={loggedIn}
      />
    );
  }
);
