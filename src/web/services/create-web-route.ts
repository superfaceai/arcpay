import { Hono } from "hono";
import type { SessionEnv } from "@hono/session";

export type WebSessionData = {
  phone?: string;
  error?: string;
  account: null | {
    accountId: string;
    isLive: boolean;
  };
};

export const createWebRoute = () => {
  const webApp = new Hono<SessionEnv<WebSessionData>>();

  return webApp;
};
