import { validator } from "hono/validator";

import {
  createWebRoute,
  getSessionAndRemoveError,
  updateSession,
} from "@/web/services";

import { CreateAccount } from "./CreateAccount";
import { signUp } from "@/identity/services";

import { requestInitialFunding } from "@/payments/services";

export const createAccountRoute = createWebRoute()
  .get("/create-account", async (c) => {
    const ctv = c.req.query("ctv");
    if (typeof ctv !== "string" || ctv.trim() === "") {
      return c.redirect("/login");
    }

    const { session, error } = await getSessionAndRemoveError(c);

    return c.html(
      <CreateAccount
        email={session?.email ?? ""}
        contactVerificationSecret={ctv}
        error={error}
      />
    );
  })
  .post(
    "/create-account",
    validator("form", async (value, c) => {
      const name = value["name"];
      const ctv = value["ctv"];
      const email = value["email"];

      if (typeof ctv !== "string" || ctv.trim() === "") {
        await updateSession(c, {
          error: "Email verification expired",
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
        return c.redirect("/login");
      }

      if (typeof name !== "string" || name.trim() === "") {
        await updateSession(c, {
          error: "Name is required",
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(c.req.url);
      }

      if (name.trim().length < 3) {
        await updateSession(c, {
          error: "Name must be at least 3 characters long",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(c.req.url);
      }

      return {
        name: name.trim(),
        email: email.toString(),
        ctv,
      };
    }),
    async (c) => {
      const form = c.req.valid("form");

      const signUpResult = await signUp({
        name: form.name,
        contact: { email: form.email, verification_secret: form.ctv },
      });

      if (!signUpResult.ok) {
        if (signUpResult.error.type === "AccountHandleNotAvailableError") {
          await updateSession(c, {
            error: `The handle '${signUpResult.error.handle}' is not available`,
          });
          await new Promise((resolve) => setTimeout(resolve, 300));
          return c.redirect(c.req.url);
        }

        await updateSession(c, {
          error: "Failed to create account. Please try again.",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(c.req.url);
      }

      await updateSession(c, {
        account: {
          accountId: signUpResult.value.account,
          isLive: signUpResult.value.live,
        },
      });
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const initialFundingResult = await requestInitialFunding({
        accountId: signUpResult.value.account,
        live: signUpResult.value.live,
      });
      
      if (!initialFundingResult.ok) {
        if (initialFundingResult.error.reason === "disabled") {
          console.info(
            `Skipping initial funding for ${form.email} (feature is disabled)`
          );
        } else if (initialFundingResult.error.reason === "quota_exceeded") {
          console.info(
            `Skipping initial funding for ${form.email} (quota exceeded)`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
        return c.redirect("/home");
      }
      
      // Wait for 1 second to avoid eventual consistency issues with the initial funding
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      return c.redirect(`/initial-funding/${initialFundingResult.value.id}`);
    }
  );
