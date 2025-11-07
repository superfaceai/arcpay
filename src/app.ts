// This import needs to be here so that Vercel recognizes it as an entrypoint
import { Hono } from "hono";
// Reference Hono to prevent the import from being removed during compilation
export const _honoReference = Hono;

import { createApplicationApi, listResources, Resource } from "@/api/services";

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
import { web } from "@/web";

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

  const resources = listResources(app, ["/mcp/wallets", "/acp_checkouts"]);
  app.route("/", web(resources));
});

export default app;
