import { FC } from "hono/jsx";
import { Layout } from "@/web/components/Layout";
import {
  OutsideAppLayout,
  OutsideNavigation,
} from "@/web/components/OutsideAppLayout";

import { InitialFunding as InitialFundingEntity } from "@/payments/entities";
import { IconCheck } from "@/web/components/icons";

type InitialFundingProps = {
  initialFunding: InitialFundingEntity;
  isTestMode: boolean;
  executeEndpoint: string;
};

export const InitialFunding: FC<InitialFundingProps> = (props) => {
  return (
    <Layout isTestMode={props.isTestMode}>
      <OutsideNavigation />
      <OutsideAppLayout>
        <div
          id="initialFundingContainer"
          data-init={`@post('${props.executeEndpoint}')`}
        >
          <InitialFundingState
            initialFunding={props.initialFunding}
            redirectSuccessAfter={0}
          />
        </div>
      </OutsideAppLayout>
    </Layout>
  );
};

export const InitialFundingState: FC<
  Pick<InitialFundingProps, "initialFunding"> & {
    redirectSuccessAfter?: number;
  }
> = ({ initialFunding, redirectSuccessAfter = 5 }) => {
  return (
    <div class="initial-funding fade-in" id="initialFundingContent">
      {initialFunding.status === "requested" && (
        <>
          <div class="status loading">.</div>
          <h1>Setting up your account...</h1>
        </>
      )}

      {initialFunding.status === "processing" && (
        <>
          <div class="status loading">.</div>
          <h1>Funding your account...</h1>
        </>
      )}

      {initialFunding.status === "failed" && (
        <>
          <h1>Almost there...</h1>

          <p className="message">
            Your account is set up and ready to use!
            <br />
            <br />
            Unfortunately something went wrong while funding your agentic
            wallet. You can deposit funds manually later, or reach out to us at{" "}
            <a
              href={`mailto:support@arcpay.ai?subject=Initial%20Funding%20Failed%20[${initialFunding.id}]&body=I'm having trouble funding my account`}
            >
              support@arcpay.ai
            </a>
            .
          </p>

          <a href="/home" class="button primary large fade-in">
            Go to your account
          </a>
        </>
      )}

      {initialFunding.status === "succeeded" && (
        <>
          <div class="status success">
            <IconCheck />
          </div>

          <h1>
            You've received {initialFunding.amount} {initialFunding.currency}{" "}
            in&nbsp;test funds
          </h1>

          <a href="/home" class="button primary large fade-in">
            Start with agentic payments
          </a>

          {redirectSuccessAfter > 0 && (
            <>
              <span class="redirecting">
                Redirecting in {redirectSuccessAfter} seconds...
              </span>

              <script
                dangerouslySetInnerHTML={{
                  __html: `setTimeout(() => { window.location.href = "/home"; }, ${
                    redirectSuccessAfter * 1000
                  });`,
                }}
              ></script>
            </>
          )}
        </>
      )}
    </div>
  );
};
