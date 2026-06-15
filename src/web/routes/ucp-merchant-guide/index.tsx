import { getRequestOrigin } from "@/lib";
import { createWebRoute, isLoggedIn } from "@/web/services";

import { getPaymentHandlerSpecPath } from "@/ucp-payment-handler/services";
import { UcpMerchantGuide } from "./UcpMerchantGuide";

export const ucpMerchantGuideRoute = createWebRoute().get(
  getPaymentHandlerSpecPath(),
  async (c) => {
    const host = getRequestOrigin(c);
    const loggedIn = await isLoggedIn(c);
    return c.html(<UcpMerchantGuide host={host} isLoggedIn={loggedIn} />);
  }
);
