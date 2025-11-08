import { useSession, useSessionStorage } from "@hono/session";
import { db } from "@/database";
import Config from "@/config";

import { createWebRoute } from "./create-web-route";

const EXPIRE_TIME_SECONDS = 30 * 24 * 60 * 60; // 30 days

export const createWebApplication = <
  A extends ReturnType<typeof createWebRoute>
>(
  registerRoutes: (app: A) => void
) => {
  const app = createWebRoute();

  app.use(
    useSessionStorage({
      async delete(sid) {
        return await db.del(`session:${sid}`);
      },
      async get(sid) {
        const data = await db.get<any>(`session:${sid}`);
        return data;
      },
      async set(sid, value) {
        return await db.set(`session:${sid}`, value, {
          ex: EXPIRE_TIME_SECONDS,
        });
      },
    }),
    useSession({
      secret: Config.SESSION_SECRET,
    })
  );

  registerRoutes(app as A);

  return app;
};
