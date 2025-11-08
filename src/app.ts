// This import needs to be here so that Vercel recognizes it as an entrypoint
import { Hono } from "hono";
// Reference Hono to prevent the import from being removed during compilation
export const _honoReference = Hono;

import { createApplicationApi, listResources } from "@/api/services";
import { createWebApplication } from "@/web/services";

import { erasureApi } from "@/erasure/api";
import { accountsApi, contactsApi } from "@/identity/api";
import { balancesApi, locationsApi } from "@/balances/api";
import {
  depositsApi,
  transactionsApi,
  paymentsApi,
  paymentMandatesApi,
  paymentCapturesApi,
} from "@/payments/api";
import { notificationsApi } from "@/notifications/api";
import { acpDelegatedPaymentsApi } from "@/acp/api/delegated-payments";

import { walletMcp } from "@/wallet/mcp";
import { acpCheckoutsMcp } from "@/acp-checkouts/mcp";

import { indexRoute } from "@/web/routes/index";
import { loginRoute } from "@/web/routes/login";
import { confirmCodeRoute } from "@/web/routes/confirm-code";
import { dashboardRoute } from "@/web/routes/dashboard";
import { createAccountRoute } from "@/web/routes/create-account";
import { logoutRoute } from "@/web/routes/logout";

const app = createApplicationApi((app) => {
  app.route("/", erasureApi);
  app.route("/", accountsApi);
  app.route("/", contactsApi);

  app.route("/", balancesApi);
  app.route("/", locationsApi);
  app.route("/", depositsApi);
  app.route("/", paymentsApi);
  app.route("/", paymentMandatesApi);
  app.route("/", paymentCapturesApi);
  app.route("/", transactionsApi);

  app.route("/", notificationsApi);

  app.route("/", acpDelegatedPaymentsApi);
  app.route("/", acpCheckoutsMcp);
  app.route("/", walletMcp);

  const resources = listResources(app, ["/wallet", "/acp_checkouts"]);

  const webApp = createWebApplication((web) => {
    web.route("/", indexRoute(resources));
    web.route("/", loginRoute);
    web.route("/", logoutRoute);
    web.route("/", confirmCodeRoute);
    web.route("/", createAccountRoute);
    web.route("/", dashboardRoute);
  });

  app.route("/", webApp);
});

export default app;
