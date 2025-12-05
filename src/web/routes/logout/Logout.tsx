import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";

import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

type LogoutProps = {
  removeOnly?: boolean;
  isTestMode: boolean;
};

export const Logout: FC<LogoutProps> = (props: LogoutProps) => {
  return (
    <Layout isTestMode={props.isTestMode}>
      <OutsideNavigation closeLink="/login" />
      <OutsideAppLayout>
        {props.removeOnly ? (
          <h2>Are you sure you want to remove your account and all data?</h2>
        ) : (
          <h2>Are you sure you want to log out?</h2>
        )}

        <div className="actions">
          {!props.removeOnly && (
            <form id="logout-form" method="post" action="/logout">
              <button type="submit" className="large primary">
                Log out
              </button>
            </form>
          )}

          <form
            id="remove-account-form"
            method="post"
            action="/logout?remove=true"
          >
            <button type="submit" className="large danger">
              Remove account & all data
            </button>
          </form>
        </div>
      </OutsideAppLayout>
    </Layout>
  );
};
