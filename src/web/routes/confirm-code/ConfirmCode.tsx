import { Layout } from "@/web/components/Layout";
import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";
import { FC } from "hono/jsx";

export const ConfirmCode: FC = () => {
  return (
    <Layout>
      <OutsideNavigation closeLink="/login" />
      <OutsideAppLayout>
        <form id="confirm-phone-form" method="post" action="/confirm-code">
          <div class="form-field">
            <label for="code">Confirmation code</label>
            <input class="large" type="number" id="code" name="code" placeholder="XXXXXX" required />
            <p class="text-small">Enter the code you received via email</p>
          </div>

          <button type="submit" class="primary large">
            Confirm email
          </button>
        </form>
      </OutsideAppLayout>
    </Layout>
  );
};
