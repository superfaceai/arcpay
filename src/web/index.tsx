import { Home } from "@/web/pages/Home";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { listResources } from "@/api/services";
import { csrf } from "hono/csrf";
import { validator } from "hono/validator";
import { useSession, useSessionStorage } from "@hono/session";
import type { SessionEnv } from "@hono/session";
import { OpenAccount } from "./pages/OpenAccount";
import { ConfirmPhoneNumber } from "./pages/ConfirmPhoneNumber";
import { MyAccount } from "./pages/MyAccount";
import { db } from "@/database";

const EXPIRE_TIME_SECONDS = 30 * 24 * 60 * 60; // 30 days

type SessionData = {
  phone?: string;
  error?: string;
  account?: {
    key: string;
  };
};

export const web = (resources: ReturnType<typeof listResources>) => {
  const app = new Hono<SessionEnv<SessionData>>();

  app.use(csrf());

  app.use(
    useSessionStorage({
      async delete(sid) {
        return await db.del(`session:${sid}`);
      },
      async get(sid) {
        return await db.get<any>(`session:${sid}`);
      },
      async set(sid, value) {
        console.log("Session data set:", value);
        return await db.set(`session:${sid}`, value, {
          ex: EXPIRE_TIME_SECONDS,
        });
      },
    }),
    useSession({
      secret: process.env.SESSION_SECRET,
    })
  );

  app.use("/public/*", serveStatic({ root: "./src/web" }));
  app.get("/", (c) => {
    const host = new URL(c.req.url);
    return c.html(<Home host={host.toString()} resources={resources} />);
  });

  app.get("/open-account", async (c) => {
    const session = (await c.var.session.get()) ?? {};
    const phone = session.phone;
    const error = session.error;
    session.error = undefined;
    await c.var.session.update(session);

    return c.html(<OpenAccount phone={phone} error={error} />);
  });
  app.post(
    "/open-account",
    validator("form", async (value, c) => {
      const phone = value["phone"];
      if (typeof phone !== "string" || phone.trim() === "") {
        return c.redirect(
          `/open-account?error=${encodeURIComponent(
            "Phone number is required"
          )}`
        );
      }

      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
      if (!phoneRegex.test(phone)) {
        await c.var.session.update({
          phone,
          error: "Invalid phone number format",
        });
        return c.redirect(`/open-account`);
      }

      return {
        phone: phone.trim(),
      };
    }),
    async (c) => {
      const form = c.req.valid("form");
      console.log(`Creating account for phone number: ${form.phone}`);

      // TODO create conformation code and send SMS

      return c.redirect("/confirm-phone");
    }
  );

  app.get("/confirm-phone", async (c) => {
    const session = (await c.var.session.get()) ?? {};
    const error = session?.error;
    session.error = undefined;
    await c.var.session.update(session);
    return c.html(<ConfirmPhoneNumber error={error} />);
  });

  app.post(
    "/confirm-phone",
    validator("form", (value, c) => {
      const code = value["code"];
      if (typeof code !== "string" || code.trim() === "") {
        c.var.session.set("error", "Confirmation code is required");
        return c.redirect(
          `/confirm-phone?error=${encodeURIComponent(
            "Confirmation code is required"
          )}`
        );
      }

      return {
        code: code.trim(),
      };
    }),
    async (c) => {
      const form = c.req.valid("form");
      console.log(`Confirming phone number with code: ${form.code}`);

      // TODO verify confirmation code
      // TODO create account

      return c.redirect("/my-account");
    }
  );

  app.get("/my-account", async (c) => {
    return c.html(<MyAccount />);
  });

  return app;
};
