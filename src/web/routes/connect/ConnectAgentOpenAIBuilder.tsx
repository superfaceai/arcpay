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
  ucpMcpUrl: string;
  apiKey: ApiKey;
};

export const ConnectAgentOpenAIBuilder: FC<ConnectAgentOpenAIBuilderProps> = (
  props: ConnectAgentOpenAIBuilderProps
) => {
  const UCP_ID = 'ucp-shopping';
  const ACP_ID = 'acp-shopping';

  return (
    <Layout isTestMode={props.isTestMode}>
      <AppLayout>
        <AppNavigation account={props.account} backLink={`/home`} />

        <div className="connect-agent" data-signals={`{ openProtocol: "${UCP_ID}" }`}>
          <AgentHeader agentName={props.agent.name} />

          <div className="steps-list">
            <div className="step">
              <h3>Connect Wallet MCP</h3>

              {Config.GUIDE_OPENAI_BUILDER_WALLET_MCP_VIDEO_URL && (
                <video
                  src={Config.GUIDE_OPENAI_BUILDER_WALLET_MCP_VIDEO_URL}
                  controls
                  autoPlay
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
              <h3>Choose shopping protocol</h3>

              <p>
                Pick the shopping protocol your merchant supports to navigate the checkout process.
              </p>

              <div className="merchant-type-selector">
                <label className="merchant-type-option">
                  <div className="merchant-type-main">
                    <div className="merchant-type-icon">
                      <img src="/protocols/ucp.png" alt="UCP" />
                    </div>
                    <div className="merchant-type-text">
                      <div className="merchant-type-title">UCP</div>
                    </div>
                  </div>
                  <div className="merchant-type-radio">
                    <span className="merchant-type-radio-inner" />
                  </div>
                  <input
                    type="radio"
                    name="merchantType"
                    value="ucp"
                    aria-label="UCP"
                    checked={true}
                    data-on:click={`$openProtocol = '${UCP_ID}'`}
                  />
                </label>

                <label className="merchant-type-option">
                  <div className="merchant-type-main">
                    <div className="merchant-type-icon">
                      <img src="/protocols/acp.png" alt="ACP" />
                    </div>
                    <div className="merchant-type-text">
                      <div className="merchant-type-title">ACP</div>
                    </div>
                  </div>
                  <div className="merchant-type-radio">
                    <span className="merchant-type-radio-inner" />
                  </div>
                  <input
                    type="radio"
                    name="merchantType"
                    value="acp"
                    aria-label="ACP"
                    data-on:click={`$openProtocol = '${ACP_ID}'`}
                  />
                </label>

                <label className="merchant-type-option">
                  <div className="merchant-type-main">
                    <div className="merchant-type-icon">
                      <img src="/protocols/x402.png" alt="x402" />
                    </div>
                    <div className="merchant-type-text">
                      <div className="merchant-type-title">x402 (soon)</div>
                    </div>
                  </div>
                  <div className="merchant-type-radio">
                    <span className="merchant-type-radio-inner" />
                  </div>
                  <input
                    type="radio"
                    name="merchantType"
                    value="x402"
                    aria-label="x402"
                    disabled
                  />
                </label>
              </div>
            </div>

            <div class="separator long" />

            <ShoppingMcpSteps
              id={UCP_ID}
              apiKey={props.apiKey}
              protocol={{ kind: 'ucp', mcpUrl: props.ucpMcpUrl }}
            />
            <ShoppingMcpSteps
              id={ACP_ID}
              apiKey={props.apiKey}
              protocol={{ kind: 'acp', mcpUrl: props.acpMcpUrl }}
            />
          </div>
        </div>
      </AppLayout>
    </Layout>
  );
};

function ShoppingMcpSteps(props: {
  apiKey: ApiKey;
  protocol: { kind: 'ucp', mcpUrl: string } | { kind: 'acp', mcpUrl: string };
  id: string;
}) {
  const mcpUrl = props.protocol.mcpUrl;

  const shoppingMcpParagraph = props.protocol.kind === 'ucp'
    ? <>To help your agent navigate shopping carts & checkouts, connect
      the{" "}
      <a href="https://ucp.dev" target="_blank">
        UCP
      </a>{" "}
      shopping MCP server.</>
    : <>To help your agent navigate shopping carts & checkouts, connect
      the{" "}
      <a href="https://www.agenticcommerce.dev" target="_blank">
        ACP
      </a>{" "}
      shopping MCP server.</>;

  const instructionsParagraph = props.protocol.kind === 'ucp'
    ? <>
      Use our{" "}
      <a href="https://merchant-demo.arcpay.ai" target="_blank">
        demo merchant store
      </a>{" "}
      to try out Arc Pay wallet with Universal Commerce Protocol (UCP).
    </>
    : <>
      Use our{" "}
      <a href="https://merchant-demo.arcpay.ai" target="_blank">
        demo merchant store
      </a>{" "}
      to try out Arc Pay wallet with Agentic Commerce Protocol (ACP).
    </>

  const prompt = `Payment actions:
- When asked to purchase goods, find the available products
- Reason about the product's choices, quantities, and prices
- Select the best product(s) for the user
- Addresses are available via wallet

Merchant:
- products in JSON: https://merchant-demo.arcpay.ai/api/products
- ${props.protocol.kind === 'ucp'
      ? 'UCP base url: https://merchant-demo.arcpay.ai/api/ucp'
      : 'ACP base url: https://merchant-demo.arcpay.ai/api/acp'}
`

  return (<div class="steps-list reset" data-show={`$openProtocol === '${props.id}'`}>
    <div className="step">
      <h3>Connect shopping client {props.protocol.kind === 'ucp' ? 'for UCP' : 'for ACP'}</h3>

      {Config.GUIDE_OPENAI_BUILDER_SHOPPING_MCP_VIDEO_URL && (
        <video
          src={Config.GUIDE_OPENAI_BUILDER_SHOPPING_MCP_VIDEO_URL}
          controls
          loop
          muted
          playsInline
        >
          Select your agent → Click <code>+</code> in Tools section →
          Choose <code>MCP Sever</code> → Click <code>+ Server</code>
        </video>
      )}

      <p>
        {shoppingMcpParagraph}
      </p>

      <Snippet
        content={mcpUrl}
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
          loop
          muted
          playsInline
        >
          Select your agent → Paste the instructions into the
          "Instructions" field
        </video>
      )}

      <p>
        {instructionsParagraph}
      </p>

      <p>
        Add instructions to help your agent navigate shopping carts,
        checkouts, and payments with permissions. Minimal overview of
        the merchant information usually works, for example:
      </p>

      <Snippet content={prompt} />
    </div>

    <div class="separator long" />

    <div className="step">
      <h3>Try it out!</h3>

      <p>
        Try out your autonomous agent commerce with a simple prompt.
      </p>

      <Snippet
        content={`We need to replenish coffee filters on the 7th floor.\nLast time the 500pcs package was enough, order new ones`}
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
  </div>)
}