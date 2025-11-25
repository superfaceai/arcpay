import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import { Header } from "@/web/components/Header";
import { Footer } from "@/web/components/Footer";

interface IndexPageProps {
  isLoggedIn: boolean;
}

export const IndexPage: FC<IndexPageProps> = (props: IndexPageProps) => {
  return (
    <Layout>
      <Header isLoggedIn={props.isLoggedIn} />

      <div className="index">
        <div className="content">
          <h1 class="fade-in">
            Enable payments
            <br />
            for your AI agents
          </h1>

          <p class="fade-in">
            Arc Pay is secure and easy way for your AI agents to pay for
            physical or digital goods and services—autonomously, on your terms
          </p>

          <form method="post" action="/login" class="fade-in">
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

          <img
            class="diagram fade-in"
            src="/arc_pay_agentic_wallet.png"
            alt="Arc Pay: Agentic wallet"
          />
        </div>
      </div>

      <Footer />
    </Layout>
  );
};
