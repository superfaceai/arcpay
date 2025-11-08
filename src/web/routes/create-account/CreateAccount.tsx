import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

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
      <OutsideNavigation closeLink="/login" />
      <OutsideAppLayout>
        {props.error && <p class="error-message">{props.error}</p>}

        <form
          id="create-account-form"
          method="post"
          action={`/create-account?phv=${props.phoneVerificationSecret}`}
        >
          <div class="form-field">
            <label for="name">Name</label>
            <input
              type="text"
              class="large"
              id="name"
              name="name"
              placeholder="Son of Anton"
              required
            />
            <input
              type="hidden"
              id="phone"
              name="phone"
              value={props.phone}
              readonly
            />
            <input
              type="hidden"
              id="phv"
              name="phv"
              value={props.phoneVerificationSecret}
              readonly
            />
          </div>

          <button type="submit" class="primary large">
            Create account
          </button>
        </form>
      </OutsideAppLayout>
    </Layout>
  );
};
