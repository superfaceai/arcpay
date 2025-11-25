import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import { Logo } from "@/web/components/Logo";
import { Header } from "@/web/components/Header";

interface IndexPageProps {}

export const IndexPage: FC<IndexPageProps> = (props: IndexPageProps) => {
  return (
    <Layout>
      <Header />

      <div className="index">
        <div className="index-content">
          <Logo variant="full" size="large" />

          <p>
            Secure and easy way for your AI agents to pay for physical or
            digital goods and services—autonomously, on your terms
          </p>

          <a href="/login" className="button primary large">
            Log in
          </a>

          <div className="buttons">
            <a
              href="https://github.com/superfaceai/arcpay"
              className="button ghost small"
              target="_blank"
            >
              GitHub
            </a>
          </div>
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
