import { Context } from "hono";
import { SessionEnv } from "@hono/session";
import { WebSessionData } from "./create-web-route";

const DEFAULT_SESSION: WebSessionData = {
  account: null,
};

export const updateSession = async (
  c: Context<SessionEnv<WebSessionData>>,
  sessionData: Partial<WebSessionData>
): Promise<WebSessionData> => {
  const existingSession = await getSession(c);

  const newSessionData: WebSessionData = Object.assign(
    { ...existingSession },
    { ...sessionData }
  );

  await c.var.session.update(newSessionData);

  return newSessionData;
};

export const getSession = async (
  c: Context<SessionEnv<WebSessionData>>
): Promise<WebSessionData> => {
  const session = await c.var.session.get();
  if (!session) {
    await c.var.session.update(DEFAULT_SESSION);
    return DEFAULT_SESSION;
  }

  return session;
};

export const getSessionAndRemoveError = async (
  c: Context<SessionEnv<WebSessionData>>
): Promise<{ session: WebSessionData; error: string | undefined }> => {
  const session = await getSession(c);

  const error = session.error;
  if (error) {
    await updateSession(c, { error: undefined });
  }
  return { session, error: error ?? undefined };
};

export const isLoggedIn = async (
  c: Context<SessionEnv<WebSessionData>>
): Promise<boolean> => {
  const session = await getSession(c);
  return !!session.account;
};
