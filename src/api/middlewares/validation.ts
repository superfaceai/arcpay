import { Context, ValidationTargets } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ProblemJson } from "@/api/values";

export type ApiValidationError = {
  path: (string | number | symbol)[];
  message: string;
};

export type CreateValidationErrorResponse = (
  c: Context,
  target: Parameters<typeof zValidator>[0],
  errors: ApiValidationError[]
) => Response;

export const withValidation = (
  target: Parameters<typeof zValidator>[0],
  schema: Parameters<typeof zValidator>[1],
  createErrorResponse: CreateValidationErrorResponse = createValidationErrorResponse
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errors: ApiValidationError[] = result.error.issues.map((error) => ({
        path: error.path,
        message: error.message,
      }));

      return createErrorResponse(c, target, errors);
    }
  });

const createValidationErrorResponse: CreateValidationErrorResponse = (
  c,
  target,
  errors
) => {
  const serializedErrors = errors
    .map((error) => `[${error.path.join("/")}] ${error.message}`)
    .join(", ");

  const errorMessage = `Invalid ${PLACEMENT[target]} shape: ${serializedErrors}`;

  return ProblemJson(c, 400, "Bad request", errorMessage);
};

const PLACEMENT: { [key in keyof ValidationTargets]: string } = {
  json: "body",
  form: "form data",
  query: "query",
  param: "param",
  header: "header",
  cookie: "cookie",
};
