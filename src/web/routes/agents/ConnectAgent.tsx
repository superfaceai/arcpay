import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account, Agent, ApiKey } from "@/identity/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";
import { Snippet } from "@/web/components/Snippet";

type ConnectAgentProps = {
  isTestMode: boolean;
  account: Account;
  agent: Agent;
  walletMcpUrl: string;
  acpMcpUrl: string;
  apiKey: ApiKey;
};

export const ConnectAgent: FC<ConnectAgentProps> = (
  props: ConnectAgentProps
) => {
  return (
    <Layout isTestMode={props.isTestMode}>
      <AppLayout>
        <AppNavigation
          account={props.account}
          backLink={`/agents/${props.agent.id}`}
        />

        <div className="connect-agent">
          <div className="header">
            <span>{props.agent.name}</span>
            <h1>Connect wallet</h1>
          </div>

          <div className="steps-list">
            <div className="step">
              <h3>Connect wallet MCPs</h3>
              <p>Connect Arc Pay wallet MCP server to your agent.</p>

              <p>
                Add new <code>Tool</code> → <code>MCP Sever</code> (
                <em>remote</em> or <em>hosted</em>) → Manually fill the address:
              </p>

              <Snippet content={props.walletMcpUrl} />

              <p>
                To help your agent navigate shopping carts & checkouts, connect
                the{" "}
                <a href="https://www.agenticcommerce.dev" target="_blank">
                  ACP
                </a>{" "}
                shopping MCP server.
              </p>

              <Snippet content={props.acpMcpUrl} />
            </div>

            <div class="separator" />

            <div className="step">
              <h3>Authentication</h3>

              <p>
                Use this key API key to authenticate your agent with the Arc Pay
                MCP servers
              </p>

              <Snippet
                content={props.apiKey.key}
                obfuscatedContent={
                  props.apiKey.key.slice(0, 12) +
                  "••••••••••••••••••••••••••••••••"
                }
              />
              
              <p>
                If necessary, choose <code>Bearer</code> authentication type
              </p>
            </div>

            <div class="separator" />

            <div className="step optional">
              <h3>AI agent instructions</h3>

              <p>
                Add instructions to help your agent navigate shopping carts,
                checkouts, and payments with permissions.
              </p>

              <Snippet
                content={`Payment actions:
- When asked to purchase goods, find the available products
- Reason about the product's choices, quantities, and prices
- Select the best product(s) for the user
- Use the 'acp_checkouts' tool to navigate shopping carts & checkouts
- Use the 'wallet' tool to pay for the selected products`}
              />
            </div>

            <div class="separator" />

            <div className="step optional">
              <h3>Tell agent about the merchant</h3>
              <p>
                Unless you want to let your agent discover merchants itself,
                tell it about the merchant you want your agent to shop at.
              </p>

              <p>The following 2 pieces of information are required:</p>

              <ul>
                <li>Discoverable list of products (for the agent to browse)</li>
                <li>
                  Base URL of the merchant's ACP server (for Arc Pay to navigate
                  the checkout)
                </li>
              </ul>

              <p>
                Use our{" "}
                <a href="https://merchant-demo.arcpay.ai" target="_blank">
                  demo merchant store
                </a>{" "}
                to try out Arc Pay wallet with agentic commerce protocol (ACP).
              </p>

              <p>
                Minimal overview of the merchant information usually works, for
                example:
              </p>

              <Snippet
                content={`Merchant:
- products in JSON: https://merchant-demo.arcpay.ai/api/products
- ACP base url: https://merchant-demo.arcpay.ai/api/acp
`}
              />
            </div>
          </div>
        </div>
      </AppLayout>
    </Layout>
  );
};
