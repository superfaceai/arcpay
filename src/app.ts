// This import needs to be here so that Vercel recognizes it as an entrypoint
import { Hono } from "hono";
// Reference Hono to prevent the import from being removed during compilation
export const _honoReference = Hono;

import { createApplicationApi, listResources, Resource } from "@/api/services";

import { erasureApi } from "@/erasure/api";
import { identityApi } from "@/identity/api";
import { balancesApi, locationsApi } from "@/balances/api";
import { depositsApi, transactionsApi, paymentsApi } from "@/payments/api";
import { walletsMcp } from "@/wallets/mcp";

const app = createApplicationApi((app) => {
  app.route("/", erasureApi);
  app.route("/", identityApi);

  app.route("/", balancesApi);
  app.route("/", locationsApi);
  app.route("/", depositsApi);
  app.route("/", paymentsApi);
  app.route("/", transactionsApi);

  app.route("/", walletsMcp);

  app.get("/", (c) => {
    const host = new URL(c.req.url);
    const resources = listResources(app);

    return c.html(HOME_DOCS_HTML({ host: host.origin, resources }));
  });
});

export default app;

const HOME_DOCS_HTML = ({
  host,
  resources,
}: {
  host: string;
  resources: Resource[];
}) =>
  `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Pay API</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      font-size: 1rem;
      line-height: 1.3;
      margin: 0;
      padding: 0;
    }
    code, pre {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Liberation Mono", "Courier New", monospace;
      font-size: 0.9rem;
      padding: 0.2rem;
      border-radius: 0.3rem;
      background-color:rgb(236, 236, 238);
    }
    pre {
      padding: 0.75rem;
      overflow-x: auto;
      
    }
    main {
      margin: 0 auto;
      padding: 2rem 0.5rem;
      box-sizing: border-box;
      width: 100%;
      max-width: 70ch;
    }
    ul.resources {
      padding: 0;
      list-style-type: none;
    }
    ul.resources > li {
      padding: 0.5rem;
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    ul.resources > li > div:nth-child(2) {
      display: flex;
      flex-wrap: wrap;
      justify-content: end;
      gap: 0.2rem;
    }
    ul.resources > li:nth-child(even) {
      background-color: #f9f9f9;
      border-radius: 0.3rem;
    }
  </style>
</head>

<body>
  <main>
    <h1>Agent Pay API</h1>
    
    <h2>Obtain an API key</h2>

    <p>To obtain an API key, you must register with the API:</p>
    
    <pre>
POST /accounts

{
  "name": "Son of Anton"
}</pre>
      
    <p>You'll receive a response including your API key:</p>
    <pre>
{
  "object": "apikey",
  "key": "sk_test_YOUR_API_KEY"
}</pre>

    <p>Keep your API key secret and do not share it with anyone.</p>

    <h2>Authentication</h2>
    <p>Authentication is done via bearer auth. Use your API key as the bearer token in the request header:</p>

    <pre>
curl ${host}/account \\
  -H "Authorization: Bearer sk_test_YOUR_API_KEY"</pre>

    <h2>Test mode</h2>
    <p>Agent Pay supports test mode for testing and development. Test mode uses blockchain testnets & payment sandboxes to avoid real financial risks.</p>
    
    <p>To run in test mode, use the API key with prefix <code>sk_test_</code>. Live mode API keys have the prefix <code>sk_live_</code>.

    <p>Additionally, objects returned by the API will have the <code>live</code> flag set to <code>false</code> to indicate that the object is in test mode.</p>
        
    <pre>
{
  "object": "payment",
  "id": "pay_lb1veJWQWjzEwjo6tqvC5",
  "live": false,
  ...
}</pre>

  <h2>Resources</h2>
  <ul class="resources">
    ${resources
      .map(
        (resource) =>
          `<li><div><code>${resource.url}</code></div> <div>${resource.methods
            .map((method) => `<code>${method}</code>`)
            .join(" ")}</div></li>`
      )
      .join("\n")}
  </ul>

  <h2>Idempotency</h2>

  <p>The API includes idempotency to ensure that retrying a request won't accidentally repeat the same operation.</p>

  <p>To use idempotency, include the <code>Idempotency-Key</code> header in the request (e.g. UUID v4 or similar alphanumeric).</p>
  
  <p>If the same request with the same idempotency key is received multiple times, the same response is returned, even for failed requests.</p>
  
  <p>Idempotency keys expire after 24 hours.</p>
  
  <p>Only <code>POST</code> requests support idempotency key (<code>GET</code> and <code>DELETE</code> requests are idempotent by design).</p>

  <pre>
curl ${host}/deposits \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer sk_test_YOUR_API_KEY" \\
  -H "Idempotency-Key: OHGqyQ9oXRZQHGbv" \\
  -d '{ "type": "testnet_faucet", "currency": "USDC" }'</pre>
  </main>
</body>
</html>
`.trim();
