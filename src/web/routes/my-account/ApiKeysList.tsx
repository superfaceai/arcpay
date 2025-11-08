import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account, ApiKey } from "@/identity/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";

type ApiKeysListProps = {
  account: Account;
  apiKeys: ApiKey[];
};

export const ApiKeysList: FC<ApiKeysListProps> = (props: ApiKeysListProps) => {
  return (
    <Layout>
      <AppLayout>
        <AppNavigation account={props.account} backLink="/my-account" />

        <div className="padding-content container-narrow">
          <h1>Your API key</h1>
        </div>

        <div className="padding-content container-narrow">
          {props.apiKeys.map((apiKey) => (
            <div key={apiKey.id}>
              <strong>{apiKey.live ? "Live" : "Test"} key</strong>
              <p class="apikey">{apiKey.key}</p>
            </div>
          ))}
        </div>

        <div className="container-narrow padding-content">
          <p>
            <strong>Resources</strong>
          </p>

          <a href="/docs/api" className="button small secondary">
            Read API docs
          </a>
        </div>
      </AppLayout>
    </Layout>
  );
};
