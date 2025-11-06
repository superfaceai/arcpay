import { Layout } from "@/components/Layout";
import { FC } from "hono/jsx";

type OpenAccountProps = {
  phone?: string;
  error?: string;
};

export const OpenAccount: FC<OpenAccountProps> = (props: OpenAccountProps) => {
  return (
    <Layout>
      <h1>Open Account</h1>

      {props.error && <p class="error-message">{props.error}</p>}

      <form id="open-account-form" method="post" action="/open-account">
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
