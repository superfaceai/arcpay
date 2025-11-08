import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

type LoginProps = {
  email?: string;
  error?: string;
};

export const Login: FC<LoginProps> = (props: LoginProps) => {
  return (
    <Layout>
      <OutsideNavigation closeLink="/" />
      <OutsideAppLayout>
        <form id="login-form" method="post" action="/login">
          {props.error && <p class="error-message">{props.error}</p>}

          <div class="form-field">
            <label for="email">Email address</label>
            <input
              class="large"
              type="email"
              id="email"
              name="email"
              value={props.email}
              placeholder="your@email.com"
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
