import { validator } from "hono/validator";

import {
  createWebRoute,
  getSessionAndRemoveError,
  updateSession,
} from "@/web/services";

import { CreateAccount } from "./CreateAccount";
import { signUp } from "@/identity/services";

export const createAccountRoute = createWebRoute()
  .get("/create-account", async (c) => {
    const phv = c.req.query("phv");
    if (typeof phv !== "string" || phv.trim() === "") {
      return c.redirect("/login");
    }

    const { session, error } = await getSessionAndRemoveError(c);

    return c.html(
      <CreateAccount
        phone={session?.phone ?? ""}
        phoneVerificationSecret={phv}
        error={error}
      />
    );
  })
  .post(
    "/create-account",
    validator("form", async (value, c) => {
      const name = value["name"];
      const phv = value["phv"];
      const phone = value["phone"];

      if (typeof phv !== "string" || phv.trim() === "") {
        await updateSession(c, {
          error: "Phone verification expired",
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
        phone: phone.toString(),
        phv,
      };
    }),
    async (c) => {
      const form = c.req.valid("form");

      const signUpResult = await signUp({
        name: form.name,
        phone: { number: form.phone, verification_secret: form.phv },
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

      await new Promise((resolve) => setTimeout(resolve, 500));
      return c.redirect("/dashboard");
    }
  );
