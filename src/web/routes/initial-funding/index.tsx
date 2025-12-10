import { streamSSE } from "hono/streaming";

import { createWebRoute, getSession, getSessionAccount, patchElements } from "@/web/services";
import {
  loadInitialFunding,
  InitialFunding as InitialFundingEntity,
} from "@/payments/entities";

import { InitialFunding, InitialFundingState } from "./InitialFunding";
import { executeInitialFunding } from "@/payments/services";

export const initialFundingRoute = createWebRoute()
  .get("/initial-funding/:id", async (c) => {
    const id = c.req.param("id");
    const account = await getSessionAccount(c, { retry: 3 });

    if (!account) {
      return c.redirect("/login");
    }

    let attemptsLeft = 3;
    let initialFunding: InitialFundingEntity | null = null;
    while (attemptsLeft > 0) {
      initialFunding = await loadInitialFunding({
        id,
        accountId: account.accountId,
        live: account.isLive,
      });

      if (initialFunding) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_500 / attemptsLeft));
      attemptsLeft--;
    }

    if (!initialFunding) {
      return c.redirect("/home");
    }

    return c.html(
      <InitialFunding
        initialFunding={initialFunding}
        isTestMode={!account.isLive}
        executeEndpoint={`/initial-funding/${id}`}
      />
    );
  })
  .post("/initial-funding/:id", async (c) => {
    const id = c.req.param("id");
    const session = await getSession(c);

    if (!session?.account) {
      return c.redirect("/login", 303);
    }

    const initialFunding = await loadInitialFunding({
      id,
      accountId: session?.account.accountId ?? "",
      live: session?.account.isLive ?? false,
    });

    if (!initialFunding) {
      return c.redirect("/home", 303);
    }

    return streamSSE(c, async (stream) => {
      await executeInitialFunding({
        initialFunding,
        onUpdate: async (funding) => {
          const renderedState = (
            <InitialFundingState initialFunding={funding} />
          );
          await stream.writeSSE(
            patchElements({
              mode: "remove",
              selector: "#initialFundingContent",
            })
          );
          await stream.writeSSE(
            patchElements({
              mode: "append",
              selector: "#initialFundingContainer",
              elements: renderedState.toString(),
            })
          );
        },
      });
    });
  });

