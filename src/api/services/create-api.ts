import { Hono } from "hono";

type Variables = {
  accountId: string;
  isLive: boolean;
};

/**
 * Creates a base API building block with useful variables types.
 */
export const createApi = () => {
  const app = new Hono<{ Variables: Variables }>();

  return app;
};
