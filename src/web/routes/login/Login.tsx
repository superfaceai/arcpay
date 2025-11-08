import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

type LoginProps = {
  phone?: string;
  error?: string;
};

export const Login: FC<LoginProps> = (props: LoginProps) => {
  return (
    <Layout>
      <OutsideNavigation closeLink="/" />
      <OutsideAppLayout>
        <form id="open-account-form" method="post" action="/login">
          {props.error && <p class="error-message">{props.error}</p>}

          <div class="form-field">
            <label for="phone">Phone number</label>
            <input
              class="large"
              type="tel"
              id="phone"
              name="phone"
              value={props.phone}
              placeholder="+XX XXX XXX XXX"
              required
            />
          </div>

          <button type="submit" class="primary large">
            Log in
          </button>
        </form>
      </OutsideAppLayout>
    </Layout>
  );
};
