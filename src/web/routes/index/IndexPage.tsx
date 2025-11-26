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
            Safe payments
            <br />
            for your AI agents
          </h1>

          {/* <p class="fade-in">
            Arc Pay lets your AI assistants purchase&nbsp;physical & digital
            resources autonomously—within the boundaries you&nbsp;define.
          </p> */}

          {/* <p class="fade-in">
            Allow your AI agents to make approved purchases within your spending
            caps, permissions, and audit trails. No surprise charges.
          </p> */}

          {/* <p class="fade-in">
            Arc Pay lets your AI agents make approved purchases on their own.
            You set the limits and rules, and every payment stays visible and
            controlled.
          </p> */}

          <p class="fade-in">
            Arc Pay lets your AI assistants make approved purchases on their
            own. You set the limits and rules—and every payment stays visible
            and under control.
          </p>

          <form method="post" action="/login" class="fade-in">
            <div class="form-field">
              <input
                class="large highlighted"
                type="email"
                id="email"
                name="email"
                placeholder="your@email.com"
                required
              />
            </div>

            <button type="submit" class="primary large">
              Create agentic wallet
            </button>
          </form>

          <img
            class="diagram fade-in"
            src="/arc_pay_agentic_wallet.png"
            alt="Arc Pay: Agentic wallet"
          />

          <h2 class="cta fade-in">
            Add payments to
            <br />
            your AI workflows
          </h2>

          <a href="/login" class="button secondary large fade-in">
            Create agentic wallet
          </a>
        </div>
      </div>

      <Footer />
    </Layout>
  );
};
