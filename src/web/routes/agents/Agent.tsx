import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account, AgentWithRemainingAllowance } from "@/identity/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";

type AgentProps = {
  account: Account;
  agent: AgentWithRemainingAllowance;
  isTestMode: boolean;
};

export const Agent: FC<AgentProps> = (props: AgentProps) => {
  return (
    <Layout isTestMode={props.isTestMode}>
      <AppLayout>
        <AppNavigation account={props.account} backLink="/home" />

        <div className="agents-section">
          <h1 className="padding-content">{props.agent.name}</h1>

          <div className="agent-box filled">
            <div className="agent-box-content">
              <span>Allowance</span>
              <h3>
                <span>
                  {props.agent.allowance.amount}{" "}
                  {props.agent.allowance.currency}
                </span>{" "}
                <span className="muted">
                  every{" "}
                  {props.agent.allowance.frequency === "daily"
                    ? "day"
                    : props.agent.allowance.frequency === "weekly"
                    ? "week"
                    : "month"}
                </span>
              </h3>
            </div>

            <div className="agent-box-content">
              <span>Remaining allowance</span>
              <h3>
                {props.agent.remainingAllowance.amount}{" "}
                {props.agent.allowance.currency}
              </h3>
            </div>

            <div className="agent-box-content">
              <span>Allowed categories</span>
              <h3>{props.agent.allowance.categories.join(", ")}</h3>
            </div>
          </div>
        </div>

        <div className="agents-section">
          <h3>Addresses</h3>
          <div className="agent-box outlined">
            {props.account.addresses.map((address) => (
              <div key={address.id} className="agent-box-content">
                <span>
                  {address.purposes
                    .map(
                      (purpose) =>
                        purpose.charAt(0).toUpperCase() + purpose.slice(1)
                    )
                    .join(", ")}
                </span>
                <h4>{address.label}</h4>
              </div>
            ))}
          </div>
        </div>

        <div className="agents-section">
          <a href={`#`} className="button primary large">
            Connect Agent
          </a>
        </div>
      </AppLayout>
    </Layout>
  );
};
