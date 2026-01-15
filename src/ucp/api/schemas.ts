import { Context } from "hono";
import { toJSONSchema } from "zod";
import { createApi } from "@/api/services";
import { ucpSchemasRegistry } from "../values";
import { ProblemJson } from "@/api/values";
import { getPathToSchema, getSchemaFilename } from "../services";

const getSchemaUrl = (c: Context, path: string) => {
  return new URL(path, c.req.url).toString();
};

export const ucpSchemasApi = createApi().get(
  getPathToSchema(":schemaId"),
  (c) => {
    const schemaFilename = c.req.param("schemaId");
    if (!schemaFilename) return c.notFound();

    const schemaId = schemaFilename.replace(getSchemaFilename(""), "").trim();

    const { schemas } = toJSONSchema(ucpSchemasRegistry, {
      target: "draft-2020-12",
      uri: (id) => getSchemaUrl(c, getPathToSchema(getSchemaFilename(id))),
    });

    const schema = schemas[schemaId];
    if (!schema)
      return ProblemJson(
        c,
        404,
        "Not Found",
        "The requested resource was not found."
      );

    return c.text(JSON.stringify(schema, null, 2), 200, {
      "content-type": "application/schema+json",
    });
  }
);
