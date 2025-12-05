import {
  createWebRoute,
  getSession,
  getSessionAndRemoveError,
  updateSession,
} from "@/web/services";

import { Deposit } from "./Deposit";
import { withWebAuth } from "@/web/middleware";
import { depositMoney } from "@/payments/services";

export const requestDepositRoute = createWebRoute()
  .get("/request-deposit", withWebAuth({ redirectTo: "/login" }), async (c) => {
    const { session, error } = await getSessionAndRemoveError(c);

    return c.html(<Deposit error={error} isTestMode={!session.account?.isLive} />);
  })
  .post(
    "/request-deposit",
    withWebAuth({ redirectTo: "/login" }),
    async (c) => {
      const { session, error } = await getSessionAndRemoveError(c);

      if (!session.account) {
        return c.redirect("/login");
      }

      const depositResult = await depositMoney(
        {
          accountId: session.account.accountId,
          live: session.account.isLive,
        },
        {
          type: "testnet_faucet",
          currency: "USDC",
        }
      );

      if (!depositResult.ok) {
        if (depositResult.error.type === "BlockchainActionRateExceeded") {
          await updateSession(c, {
            error:
              "Too many requests for testnet funds. Please try again later.",
          });
          return c.redirect("/request-deposit");
        }

        if (depositResult.error.type === "PaymentLiveModeError") {
          await updateSession(c, {
            error:
              "Testnet deposits are only supported on test (non-live) wallets",
          });
          return c.redirect("/request-deposit");
        }

        if (depositResult.error.type === "UnsupportedBlockchainError") {
          await updateSession(c, {
            error: `The currency '${depositResult.error.currency}' is not supported on this network`,
          });
          return c.redirect("/request-deposit");
        }

        await updateSession(c, {
          error: "An error occurred while depositing funds",
        });
        return c.redirect("/request-deposit");
      }

      await new Promise((resolve) => setTimeout(resolve, 2_000));
      return c.redirect("/home");
    }
  );
