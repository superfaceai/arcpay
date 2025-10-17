import { Context } from "hono";

export type ProblemJSON = {
  instance: string;
  title: string;
  detail?: string;
  status: number;
};

export const ProblemJson = (
  c: Context,
  status: number,
  title: string,
  detail?: string
): Response => {
  const requestId = c.get("requestId");

  return new Response(
    JSON.stringify(<ProblemJSON>{
      instance: c.req.path,
      title,
      detail,
      status,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/problem+json",
        ...(requestId ? { "x-request-id": requestId } : {}),
      },
    }
  );
};
