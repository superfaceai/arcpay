import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";

type LoginProps = {
  phone?: string;
  error?: string;
};

export const Login: FC<LoginProps> = (props: LoginProps) => {
  return (
    <Layout>
      <h1>Open Account</h1>

      {props.error && <p class="error-message">{props.error}</p>}

      <form id="open-account-form" method="post" action="/login">
        <div class="form-field">
          <label for="phone">Phone number</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={props.phone}
            required
          />
        </div>

        <button type="submit">Create Account</button>
      </form>
    </Layout>
  );
};
