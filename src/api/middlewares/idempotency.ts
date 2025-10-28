import { createMiddleware } from "hono/factory";

import {
  Call,
  generateIdempotencyKey,
  IdempotencyKey,
  loadCallByIdempotencyKey,
  saveCall,
} from "@/api/entities";
import { ProblemJson } from "@/api/values";
import { REQUEST_ID_HEADER } from "./request-id.js";
import { StatusCode } from "hono/utils/http-status";
import { HonoRequest } from "hono";
import { JSONObject, JSONValue } from "hono/utils/types";

const IDEMPOTENCY_KEY_HEADER = "Idempotency-Key" as const;

const HOUR = 1000 * 60 * 60;
const EXPIRATION_TIME = HOUR * 24;

const EXCLUDED_HEADERS = [REQUEST_ID_HEADER].map((header) =>
  header.toLowerCase()
);

export const withIdempotency = () =>
  createMiddleware(async (c, next) => {
    if (c.req.method !== "POST") return next();

    const idempotencyKey =
      c.req.header(IDEMPOTENCY_KEY_HEADER) ?? generateIdempotencyKey();

    const idempotencyKeyIsValid = IdempotencyKey.safeParse(idempotencyKey);
    if (!idempotencyKeyIsValid.success) {
      return ProblemJson(
        c,
        400,
        "Invalid Idempotency-Key",
        "Invalid idempotency key. Must be a string between 1 and 128 characters long and contain only letters, numbers, underscores, and hyphens."
      );
    }

    const accountId = c.get("accountId");
    if (!accountId) {
      console.error("Idempotency can only be used with authenticated requests");
      return ProblemJson(c, 500, "Internal Server Error");
    }

    c.res.headers.set(IDEMPOTENCY_KEY_HEADER, idempotencyKey);

    const call = await loadCallByIdempotencyKey({
      accountId,
      idempotencyKey,
    });

    const requestChecksum = await getRequestChecksum(c.req);

    if (call) {
      if (call.requestChecksum !== requestChecksum) {
        return ProblemJson(
          c,
          400,
          "Idempotent request mismatch",
          "The request URL, headers, or body has changed since the last request"
        );
      }
      return c.newResponse(
        call.response.body,
        call.response.status as StatusCode,
        Object.assign(call.response.headers, {
          "Idempotency-Expires-At": call.expires_at.toISOString(),
          "Idempotency-Remaining-Seconds": Math.ceil(
            (call.expires_at.getTime() - Date.now()) / 1000
          ).toString(),
        })
      );
    }

    await next();

    const newCall = Call.parse({
      idempotencyKey,
      requestChecksum,
      response: {
        status: c.res.status,
        headers: Object.fromEntries(
          c.res.headers
            .entries()
            .filter(([key]) => !EXCLUDED_HEADERS.includes(key.toLowerCase()))
        ),
        body: await c.res.clone().text(),
      },
      created_at: new Date(),
      expires_at: new Date(Date.now() + EXPIRATION_TIME),
    });

    await saveCall({ call: newCall, accountId });
  });

const RELEVANT_REQ_HEADERS = ["Content-Type"].map((header) =>
  header.toLowerCase()
);

const getRequestChecksum = async (req: HonoRequest) => {
  const relevantHeaders = [
    ...req.raw.headers
      .entries()
      .filter(([key]) => RELEVANT_REQ_HEADERS.includes(key.toLowerCase())),
  ];

  const bodyText = await req.raw.clone().text();

  const canonicalBody = (() => {
    try {
      const jsonBody = JSON.parse(bodyText);
      return canonicalJSONString(jsonBody);
    } catch (error) {
      return bodyText;
    }
  })();

  const canonicalRepresentation = [
    req.method.toLowerCase(),
    req.url,
    relevantHeaders
      .map(([key, value]) => `${key.toLowerCase()}:${value.toLowerCase()}`)
      .join("\n"),
    canonicalBody,
  ].join("\n");

  const enc = new TextEncoder();
  const data = enc.encode(canonicalRepresentation);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const checksum = base64urlEncode(digest);

  return checksum;
};

function canonicalJSONString(value: JSONValue): string {
  return JSON.stringify(canonicalizeJSON(value));
}

function canonicalizeJSON(value: JSONValue): JSONValue {
  if (typeof value === undefined) return null;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalizeJSON);
  const sortedKeys = Object.keys(value).sort();
  const result: JSONObject = {};
  for (const k of sortedKeys) {
    result[k] = canonicalizeJSON(value[k] as JSONValue);
  }
  return result;
}

function base64urlEncode(arrayBuffer: ArrayBuffer): string {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
