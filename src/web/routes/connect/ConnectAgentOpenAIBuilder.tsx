import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import Config from "@/config";

import { Account, Agent, ApiKey } from "@/identity/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";
import { Snippet } from "@/web/components/Snippet";
import { AgentHeader } from "@/web/components/AgentHeader";

type ConnectAgentOpenAIBuilderProps = {
  isTestMode: boolean;
  account: Account;
  agent: Agent;
  walletMcpUrl: string;
  acpMcpUrl: string;
  apiKey: ApiKey;
};

export const ConnectAgentOpenAIBuilder: FC<ConnectAgentOpenAIBuilderProps> = (
  props: ConnectAgentOpenAIBuilderProps
) => {
  return (
    <Layout isTestMode={props.isTestMode}>
      <AppLayout>
        <AppNavigation account={props.account} backLink={`/home`} />

        <div className="connect-agent">
          <AgentHeader agentName={props.agent.name} />

          <div className="steps-list">
            <div className="step">
              <h3>Connect Wallet MCP</h3>

              {Config.GUIDE_OPENAI_BUILDER_WALLET_MCP_VIDEO_URL && (
                <video
                  src={Config.GUIDE_OPENAI_BUILDER_WALLET_MCP_VIDEO_URL}
                  controls
                  // autoPlay
                  loop
                  muted
                  playsInline
                >
                  Select your agent → Click <code>+</code> in Tools section →
                  Choose <code>MCP Sever</code> → Click <code>+ Server</code>
                </video>
              )}

              <p>Connect Arc Pay wallet MCP server to your agent.</p>

              <p>
                Add new <code>Tool</code> → <code>MCP Sever</code> (
                <em>remote</em> or <em>hosted</em>) → Manually fill the address:
              </p>

              <Snippet
                content={props.walletMcpUrl}
                copyText="Wallet MCP"
                copyPrimary
              />

              <Snippet content={"Wallet"} copyText="Copy label" copyPrimary />

              <Snippet
                content={props.apiKey.key}
                obfuscatedContent={
                  props.apiKey.key.slice(0, 12) +
                  "••••••••••••••••••••••••••••••••"
                }
                copyText="Copy token"
                copyPrimary
              />
            </div>

            <div class="separator long" />

            <div className="step">
              <h3>Connect Shopping MCP</h3>

              {Config.GUIDE_OPENAI_BUILDER_SHOPPING_MCP_VIDEO_URL && (
                <video
                  src={Config.GUIDE_OPENAI_BUILDER_SHOPPING_MCP_VIDEO_URL}
                  controls
                  // autoPlay
                  loop
                  muted
                  playsInline
                >
                  Select your agent → Click <code>+</code> in Tools section →
                  Choose <code>MCP Sever</code> → Click <code>+ Server</code>
                </video>
              )}

              <p>
                To help your agent navigate shopping carts & checkouts, connect
                the{" "}
                <a href="https://www.agenticcommerce.dev" target="_blank">
                  ACP
                </a>{" "}
                shopping MCP server.
              </p>

              <Snippet
                content={props.acpMcpUrl}
                copyText="Shopping MCP"
                copyPrimary
              />

              <Snippet content={"Shopping"} copyText="Copy label" copyPrimary />

              <Snippet
                content={props.apiKey.key}
                obfuscatedContent={
                  props.apiKey.key.slice(0, 12) +
                  "••••••••••••••••••••••••••••••••"
                }
                copyText="Copy token"
                copyPrimary
              />

              <div></div>
            </div>

            <div class="separator long" />

            <div className="step">
              <h3>Tell agent about the merchant</h3>

              {Config.GUIDE_OPENAI_BUILDER_INSTRUCTIONS_VIDEO_URL && (
                <video
                  src={Config.GUIDE_OPENAI_BUILDER_INSTRUCTIONS_VIDEO_URL}
                  controls
                  // autoPlay
                  loop
                  muted
                  playsInline
                >
                  Select your agent → Paste the instructions into the
                  "Instructions" field
                </video>
              )}

              <p>
                Use our{" "}
                <a href="https://merchant-demo.arcpay.ai" target="_blank">
                  demo merchant store
                </a>{" "}
                to try out Arc Pay wallet with agentic commerce protocol (ACP).
              </p>

              <p>
                Add instructions to help your agent navigate shopping carts,
                checkouts, and payments with permissions. Minimal overview of
                the merchant information usually works, for example:
              </p>

              <Snippet
                content={`Payment actions:
- When asked to purchase goods, find the available products
- Reason about the product's choices, quantities, and prices
- Select the best product(s) for the user

Merchant:
- products in JSON: https://merchant-demo.arcpay.ai/api/products
- ACP base url: https://merchant-demo.arcpay.ai/api/acp
`}
              />
            </div>

            <div class="separator long" />

            <div className="step">
              <h3>Try it out!</h3>

              <p>
                Try out your autonomous agent commerce with a simple prompt.
              </p>

              <Snippet
                content={`umm, we ran out of coffee on the 7th floor`}
                copyText="Copy prompt"
              />

              <p>
                You can track the in-progress cart and confirmed orders at our{" "}
                <a href="https://merchant-demo.arcpay.ai" target="_blank">
                  demo merchant store
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </AppLayout>
    </Layout>
  );
};
