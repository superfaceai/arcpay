import { validator } from "hono/validator";
import { PhoneNumber } from "@/lib";

import { loginViaPhone } from "@/identity/services";
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

    return c.html(<Login phone={session?.phone} error={error} />);
  })
  .post(
    "/login",
    validator("form", async (value, c) => {
      const phone = value["phone"];
      if (typeof phone !== "string" || phone.trim() === "") {
        await updateSession(c, {
          error: "Phone number is required",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }

      const phoneResult = PhoneNumber.safeParse(phone);

      if (!phoneResult.success) {
        await updateSession(c, {
          phone,
          error: phoneResult.error.issues[0].message,
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }
      return {
        phone: phoneResult.data,
      };
    }),
    async (c) => {
      const form = c.req.valid("form");

      const confirmationCodeResult = await loginViaPhone({ phone: form.phone });

      if (!confirmationCodeResult.ok) {
        await updateSession(c, {
          phone: form.phone,
          error: "Failed to send login code",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }

      await updateSession(c, {
        phone: form.phone,
      });

      return c.redirect("/confirm-code");
    }
  );
