import { streamSSE } from "hono/streaming";

import { createWebRoute, getSession, patchElements } from "@/web/services";
import { loadInitialFunding } from "@/payments/entities";

import { InitialFunding, InitialFundingState } from "./InitialFunding";
import { executeInitialFunding } from "@/payments/services";

export const initialFundingRoute = createWebRoute()
  .get("/initial-funding/:id", async (c) => {
    const id = c.req.param("id");
    const session = await getSession(c);

    if (!session?.account) {
      return c.redirect("/login");
    }

    const initialFunding = await loadInitialFunding({
      id,
      accountId: session?.account.accountId ?? "",
      live: session?.account.isLive ?? false,
    });

    if (!initialFunding) {
      return c.redirect("/home");
    }

    return c.html(
      <InitialFunding
        initialFunding={initialFunding}
        isTestMode={!session?.account.isLive}
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
