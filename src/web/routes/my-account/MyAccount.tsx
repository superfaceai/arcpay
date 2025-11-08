import { Layout } from "@/web/components/Layout";
import { FC } from "hono/jsx";

import { Account } from "@/identity/entities";
import { AppLayout, AppNavigation } from "@/web/components/AppLayout";

type MyAccountProps = {
  account: Account;
};

export const MyAccount: FC<MyAccountProps> = (props: MyAccountProps) => {
  return (
    <Layout>
      <AppLayout>
        <AppNavigation account={props.account} backLink="/home" />

        <div className="account-box">
          <h1>{props.account.name}</h1>
          <span className="muted">
            {props.account.type === "individual" ? "Individual" : "Business"}
          </span>

          <span className="handle">@{props.account.handle}</span>
        </div>

        <div className="account-actions">
          <div>
            <a href="/my-account/api-keys" className="button small secondary">
              Show my API key
            </a>
          </div>

          <form id="logout-form" method="post" action="/logout">
            <button type="submit" className="small secondary">
              Log out
            </button>
          </form>

          <div>
            <a href="/logout?remove=true" className="button small ghost">
              Remove account
            </a>
          </div>
        </div>
      </AppLayout>
    </Layout>
  );
};
