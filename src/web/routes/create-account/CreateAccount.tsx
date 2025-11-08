import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

type CreateAccountProps = {
  email: string;
  contactVerificationSecret: string;
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
          action={`/create-account?ctv=${props.contactVerificationSecret}`}
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
              id="ctv"
              name="ctv"
              value={props.contactVerificationSecret}
              readonly
            />
            <input
              type="hidden"
              id="email"
              name="email"
              value={props.email}
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
