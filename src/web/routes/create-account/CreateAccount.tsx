import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";

type CreateAccountProps = {
  phone: string;
  phoneVerificationSecret: string;
  error?: string;
};

export const CreateAccount: FC<CreateAccountProps> = (
  props: CreateAccountProps
) => {
  return (
    <Layout>
      <h1>Create Account</h1>

      {props.error && <p class="error-message">{props.error}</p>}

      <form
        id="create-account-form"
        method="post"
        action={`/create-account?phv=${props.phoneVerificationSecret}`}
      >
        <div class="form-field">
          <label for="name">Phone number</label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={props.phone}
            readonly
          />
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            placeholder="Son of Anton"
            required
          />
          <input
            type="hidden"
            id="phv"
            name="phv"
            value={props.phoneVerificationSecret}
            readonly
          />
        </div>

        <button type="submit">Create Account</button>
      </form>
    </Layout>
  );
};
