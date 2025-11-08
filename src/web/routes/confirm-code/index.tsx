import { validator } from "hono/validator";
import {
  createWebRoute,
  getSessionAndRemoveError,
  updateSession,
} from "@/web/services";
import { confirmCode } from "@/identity/services";

import { ConfirmCode } from "./ConfirmCode";

export const confirmCodeRoute = createWebRoute()
  .get("/confirm-code", async (c) => {
    const { session, error } = await getSessionAndRemoveError(c);

    return c.html(<ConfirmCode error={error} />);
  })
  .post(
    "/confirm-code",
    validator("form", async (value, c) => {
      const code = value["code"];
      if (typeof code !== "string" || code.trim() === "") {
        await updateSession(c, {
          error: "Confirmation code is required",
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/confirm-code`);
      }

      const rawCode = code.replace(/\D/g, "").trim();

      if (isNaN(Number(rawCode))) {
        await updateSession(c, {
          error: "Confirmation code must be a valid number",
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/confirm-code`);
      }

      return {
        code: parseInt(rawCode),
      };
    }),
    async (c) => {
      const form = c.req.valid("form");

      const confirmCodeResult = await confirmCode({ code: form.code });

      if (!confirmCodeResult.ok) {
        await updateSession(c, {
          error: confirmCodeResult.error.message,
        });
        await new Promise((resolve) => setTimeout(resolve, 300));
        return c.redirect(`/login`);
      }

      if (confirmCodeResult.value.next === "login") {
        await updateSession(c, {
          account: {
            accountId: confirmCodeResult.value.account.id,
            isLive: false,
          },
        });
        await new Promise((resolve) => setTimeout(resolve, 500));
        return c.redirect("/home");
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      return c.redirect(
        `/create-account?ctv=${confirmCodeResult.value.contactVerification.secret}`
      );
    }
  );
