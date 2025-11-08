import { z } from "zod";
import { validator } from "hono/validator";

import { loginWithContact } from "@/identity/services";
import { loadAccountById } from "@/identity/entities";

import {
  createWebRoute,
  getSessionAndRemoveError,
  updateSession,
} from "@/web/services";

import { Login } from "./Login";

export const loginRoute = createWebRoute()
  .get("/login", async (c) => {
    const { session, error } = await getSessionAndRemoveError(c);

    if (session.account) {
      const account = await loadAccountById(session.account.accountId);
      if (account) return c.redirect("/home");
    }

    return c.html(<Login email={session?.email} error={error} />);
  })
  .post(
    "/login",
    validator("form", async (value, c) => {
      const email = value["email"];
      if (typeof email !== "string" || email.trim() === "") {
        await updateSession(c, {
          error: "Email address is required",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }

      const emailResult = z.email().safeParse(email);

      if (!emailResult.success) {
        await updateSession(c, {
          email,
          error: emailResult.error.issues[0].message,
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }
      return {
        email: emailResult.data
      };
    }),
    async (c) => {
      const form = c.req.valid("form");

      const confirmationCodeResult = await loginWithContact({
        email: form.email,
      });

      if (!confirmationCodeResult.ok) {
        await updateSession(c, {
          email: form.email,
          error: "Failed to send login code",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }

      await updateSession(c, {
        email: form.email,
      });

      return c.redirect("/confirm-code");
    }
  );
