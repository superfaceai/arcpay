import { createWebRoute, isLoggedIn } from "@/web/services";

import { getPaymentHandlerSpecPath } from "@/ucp-payment-handler/services";
import { UcpMerchantGuide } from "./UcpMerchantGuide";

export const ucpMerchantGuideRoute = createWebRoute().get(
  getPaymentHandlerSpecPath(),
  async (c) => {
    const host = new URL(c.req.url);
    const loggedIn = await isLoggedIn(c);
    return c.html(
      <UcpMerchantGuide host={host.origin} isLoggedIn={loggedIn} />
    );
  }
);
