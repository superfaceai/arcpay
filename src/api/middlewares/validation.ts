import { ValidationTargets } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ProblemJson } from "@/api/values";

export const withValidation = (
  target: Parameters<typeof zValidator>[0],
  schema: Parameters<typeof zValidator>[1]
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors = result.error.issues.map(
        (error) => `[${error.path.join("/")}] ${error.message}`
      );

      return ProblemJson(
        c,
        400,
        "Bad request",
        `Invalid ${PLACEMENT[target]} shape: ${errors}`
      );
    }
  });

const PLACEMENT: { [key in keyof ValidationTargets]: string } = {
  json: "body",
  form: "form data",
  query: "query",
  param: "param",
  header: "header",
  cookie: "cookie",
};
