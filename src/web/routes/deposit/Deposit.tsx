import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";

import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

type DepositProps = {
  error?: string;
};

export const Deposit: FC<DepositProps> = ({ error }: DepositProps) => {
  return (
    <Layout>
      <OutsideNavigation closeLink="/login" />
      <OutsideAppLayout>
        <h2>Request a deposit for testnet funds</h2>

        {error && <p class="error-message">{error}</p>}

        <div className="actions">
          <form id="deposit-form" method="post" action="/request-deposit">
            <button type="submit" className="large primary">
              Request USDC deposit
            </button>
          </form>
        </div>
      </OutsideAppLayout>
    </Layout>
  );
};
