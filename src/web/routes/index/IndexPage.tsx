import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import { Header } from "@/web/components/Header";

interface IndexPageProps {
  isLoggedIn: boolean;
}

export const IndexPage: FC<IndexPageProps> = (props: IndexPageProps) => {
  return (
    <Layout>
      <Header isLoggedIn={props.isLoggedIn} />

      <div className="index">
        <div className="content">
          <h1>
            Enable payments
            <br />
            for your AI agents
          </h1>

          <p>
            Arc Pay is secure and easy way for your AI agents to pay for physical or
            digital goods and services—autonomously, on your terms
          </p>

          <form method="post" action="/login">
            <div class="form-field">
              <input
                class="large"
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <button type="submit" class="primary large">
              Get agentic wallet
            </button>
          </form>
        </div>

        <div className="footer">
          by
          <a href="https://superface.ai?utm_source=arcpay" target="_blank">
            <img src="/sf-logotype-dark.svg" alt="Superface" />
          </a>
        </div>
      </div>
    </Layout>
  );
};
