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
  bridgingApi,
} from "@/payments/api";
import { notificationsApi } from "@/notifications/api";
import { acpDelegatedPaymentsApi } from "@/acp/api/delegated-payments";
import { ucpSchemasApi } from "@/ucp/api";

import { walletMcp } from "@/wallet/mcp";
import { acpCheckoutsMcp } from "@/acp-checkouts/mcp";

import { apiDocsRoute } from "@/web/routes/api-docs/index";
import { loginRoute } from "@/web/routes/login";
import { confirmCodeRoute } from "@/web/routes/confirm-code";
import { homeRoute } from "@/web/routes/home";
import { createAccountRoute } from "@/web/routes/create-account";
import { initialFundingRoute } from "@/web/routes/initial-funding";
import { logoutRoute } from "@/web/routes/logout";
import { myAccountRoute } from "@/web/routes/my-account";
import { transactionsRoute } from "@/web/routes/transactions";
import { agentsRoute } from "@/web/routes/agents";
import { connectRoute } from "@/web/routes/connect";
import { requestDepositRoute } from "@/web/routes/deposit";
import { indexRoute } from "@/web/routes/index";

const app = createApplicationApi((app) => {
  app.route("/", erasureApi);
  app.route("/", accountsApi);
  app.route("/", contactsApi);

  app.route("/", balancesApi);
  app.route("/", locationsApi);
  app.route("/", bridgingApi);
  app.route("/", depositsApi);
  app.route("/", paymentsApi);
  app.route("/", paymentMandatesApi);
  app.route("/", paymentCapturesApi);
  app.route("/", transactionsApi);

  app.route("/", notificationsApi);

  app.route("/", acpDelegatedPaymentsApi);
  app.route("/", ucpSchemasApi);
  app.route("/", acpCheckoutsMcp);
  app.route("/", walletMcp);

  const resources = listResources(app, [
    "/wallet",
    "/acp_checkouts",
    ucpSchemasApi.routes[0].path,
  ]);

  const webApp = createWebApplication((web) => {
    web.route("/", indexRoute);
    web.route("/", apiDocsRoute(resources));
    web.route("/", loginRoute);
    web.route("/", logoutRoute);
    web.route("/", confirmCodeRoute);
    web.route("/", createAccountRoute);
    web.route("/", initialFundingRoute);
    web.route("/", homeRoute);
    web.route("/", myAccountRoute);
    web.route("/", transactionsRoute);
    web.route("/", agentsRoute);
    web.route("/", connectRoute);
    web.route("/", requestDepositRoute);
  });

  app.route("/", webApp);
});

export default app;
