import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";

type LogoutProps = {
  error?: string;
};

export const Logout: FC<LogoutProps> = (props: LogoutProps) => {
  return (
    <Layout>
      <h2>Are you sure you want to log out?</h2>

      {props.error && <p class="error-message">{props.error}</p>}

      <form id="logout-form" method="post" action="/logout">
        <button type="submit">Log out</button>
      </form>
    </Layout>
  );
};
