import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import { Header } from "@/web/components/Header";
import { Footer } from "@/web/components/Footer";
import { getPathToSchema, getSchemaFilename } from "@/ucp/services";
import {
  UcpConfigId,
  UcpHandler,
  UcpMandateTokenCredentialId,
  UcpWalletPaymentInstrumentId,
} from "@/ucp/values";

interface UcpMerchantGuideProps {
  host: string;
  thisPageUrl: string;
  isLoggedIn: boolean;
}

export const UcpMerchantGuide: FC<UcpMerchantGuideProps> = (
  props: UcpMerchantGuideProps
) => {
  const specUrl = props.thisPageUrl;
  const handlerName = UcpHandler.name;
  const handlerVersion = UcpHandler.version;
  const configSchemaUrl = new URL(
    getPathToSchema(getSchemaFilename(UcpConfigId)),
    props.host
  ).toString();
  const paymentInstrumentSchemaUrl = new URL(
    getPathToSchema(getSchemaFilename(UcpWalletPaymentInstrumentId)),
    props.host
  ).toString();
  const paymentTokenCredentialSchemaUrl = new URL(
    getPathToSchema(getSchemaFilename(UcpMandateTokenCredentialId)),
    props.host
  ).toString();

  const paymentHandlerExample = {
    id: "arcpay",
    name: handlerName,
    version: handlerVersion,
    spec: specUrl,
    config_schema: configSchemaUrl,
    instrument_schemas: [paymentInstrumentSchemaUrl],
    config: {
      environment: "sandbox",
      merchant_id: "{{ your_merchant_id }}",
    },
  };

  const checkoutSessionCompleteExample = {
    id: "checkout_session_123",
    payment_data: {
      id: "pi_arcpay_001",
      handler_id: "arcpay",
      type: "wallet",
      credential: {
        type: "arcpay_mandate",
        token: "paym_eNSM2UiaOaUdlfKU6_secret_2k8ZabXp...",
        expires_at: "2026-01-16T22:10:00Z",
      },
    },
  };

  return (
    <Layout>
      <Header isLoggedIn={props.isLoggedIn} />
      <div className="apidocs">
        <h2>Demo store</h2>
        <p>
          Use the demo merchant store to try out payments with Arc Pay wallet
          using&nbsp;Universal Commerce&nbsp;Protocol&nbsp;(UCP).
        </p>

        <div className="demostore">
          <a href="https://merchant-demo.arcpay.ai" target="_blank">
            https://merchant-demo.arcpay.ai
          </a>
        </div>

        <p>
          <a href="https://merchant-demo.arcpay.ai/.well-known/ucp">
            → See demo store UCP profile
          </a>
        </p>

        <p>&nbsp;</p>

        <h2>For merchants: Arc Pay UCP payment handler</h2>

        <p>
          To accept Arc Pay payments with UCP, the merchant must include Arc Pay
          as the payment handler in all UCP Checkout Session responses.
        </p>

        <p>Arc Pay payment handler has the following specification:</p>

        <h3>Handler specification</h3>
        <p>
          <code>{specUrl}</code> <em>(this page)</em>
        </p>

        <h3>Handler name</h3>
        <p>
          <code>{handlerName}</code>
        </p>

        <h3>Version</h3>
        <p>
          <code>{handlerVersion}</code>
        </p>

        <h3>Configuration schema</h3>
        <p>
          <a href={configSchemaUrl} target="_blank">
            <code>{configSchemaUrl}</code>
          </a>
        </p>

        <h3>Payment instrument schema</h3>
        <p>
          <a href={paymentInstrumentSchemaUrl} target="_blank">
            <code>{paymentInstrumentSchemaUrl}</code>
          </a>
        </p>
        <p>
          <em>
            Note: We're extending{" "}
            <a
              href="https://ucp.dev/specification/reference/#payment-instrument"
              target="_blank"
            >
              UCP's Payment Instrument
            </a>{" "}
            with custom type <code>wallet</code> that is not officially
            supported by UCP as of date of Arc Pay UCP handler release.
          </em>
        </p>

        <h3>Payment token credential schema</h3>
        <p>
          <a href={paymentTokenCredentialSchemaUrl} target="_blank">
            <code>{paymentTokenCredentialSchemaUrl}</code>
          </a>
        </p>

        <p>&nbsp;</p>

        <h2>Handling payments with UCP</h2>

        <p>
          The merchant includes Arc Pay as the payment handler in UCP Checkout
          Session responses.
        </p>

        <p>
          An example of the{" "}
          <a
            href="https://ucp.dev/specification/reference/#payment-handler-response"
            target="_blank"
          >
            valid UCP payment handler
          </a>{" "}
          configuration is as follows:
        </p>

        <pre>{JSON.stringify(paymentHandlerExample, null, 2)}</pre>

        <p>
          The platform (agent) then completes the checkout on{" "}
          <code>/checkout-sessions/&lt;id&gt;/complete</code> by sending the
          payment mandate secret to the merchant.
        </p>

        <pre>{JSON.stringify(checkoutSessionCompleteExample, null, 2)}</pre>

        <p>
          Upon checkout completion, the merchant uses the secret token to pull
          the payment from the customer's wallet, up to the authorized limit of
          the mandate:
        </p>

        <pre>{`POST /payment_captures

{
  "amount": "20",
  "currency": "USDC",
  "granted_mandate_secret": "paym_eNSM2UiaOaUdlfKU6_secret_2k8ZabXp..."
}`}</pre>

        <p>
          For more details on Arc Pay API, see the{" "}
          <a href="/docs/api">API documentation</a>.
        </p>
      </div>

      <Footer />
    </Layout>
  );
};
