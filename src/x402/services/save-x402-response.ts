import { saveX402Response as saveX402ResponseEntity } from "@/x402/entities";

const REDACTED = "[REDACTED]";
const MAX_BODY_PREVIEW_LENGTH = 16_384;
const NON_TEXT_BODY_PLACEHOLDER = "[non-text response omitted]";

const ALLOWED_HEADERS = new Set([
  "content-type",
  "cache-control",
  "etag",
  "last-modified",
  "date",
  "x-request-id",
]);

const SENSITIVE_HEADER_PATTERNS = [
  "set-cookie",
  "authorization",
  "proxy-authenticate",
  "www-authenticate",
];

const SENSITIVE_KEY_PATTERN =
  /(token|secret|password|authorization|api_key|apikey|cookie)/i;

const isTextualContentType = (contentType: string | undefined) => {
  if (!contentType) return true;

  const normalized = contentType.toLowerCase();
  return (
    normalized.startsWith("text/") ||
    normalized.includes("json") ||
    normalized.includes("xml") ||
    normalized.includes("javascript") ||
    normalized.includes("graphql") ||
    normalized.includes("x-www-form-urlencoded")
  );
};

const filterHeaders = (headers: Headers): Record<string, string> => {
  const safeHeaders: Record<string, string> = {};

  for (const [rawName, value] of headers.entries()) {
    const name = rawName.toLowerCase();

    if (!ALLOWED_HEADERS.has(name)) continue;

    if (SENSITIVE_HEADER_PATTERNS.includes(name)) continue;
    if (name.startsWith("x-") && name.includes("token")) continue;

    safeHeaders[name] = value;
  }

  return safeHeaders;
};

const sanitizeStringBody = (value: string): string => {
  let sanitized = value;

  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]");
  sanitized = sanitized.replace(
    /(\b(?:token|secret|password|authorization|api[_-]?key|apikey|cookie)\b\s*[:=]\s*)(["']?)([^"'\s,;}{\]]+)\2/gi,
    `$1$2${REDACTED}$2`,
  );
  sanitized = sanitized.replace(
    /("(?:token|secret|password|authorization|api_key|apikey|cookie)"\s*:\s*")([^"]+)(")/gi,
    `$1${REDACTED}$3`,
  );
  sanitized = sanitized.replace(
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g,
    REDACTED,
  );

  return sanitized;
};

const sanitizeJsonBody = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeJsonBody);
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sanitizedObject: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(obj)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitizedObject[key] = REDACTED;
      } else {
        sanitizedObject[key] = sanitizeJsonBody(nestedValue);
      }
    }

    return sanitizedObject;
  }

  if (typeof value === "string") {
    return sanitizeStringBody(value);
  }

  return value;
};

const buildBodyPreview = ({
  body,
  contentType,
}: {
  body: string;
  contentType: string | undefined;
}): { bodyPreview: string; bodyWasJson: boolean; bodyTruncated: boolean } => {
  if (!isTextualContentType(contentType)) {
    return {
      bodyPreview: NON_TEXT_BODY_PLACEHOLDER,
      bodyWasJson: false,
      bodyTruncated: false,
    };
  }

  let bodyWasJson = false;
  let sanitized = sanitizeStringBody(body);

  try {
    const parsed = JSON.parse(body) as unknown;
    sanitized = JSON.stringify(sanitizeJsonBody(parsed));
    bodyWasJson = true;
  } catch {
    bodyWasJson = false;
  }

  if (sanitized.length <= MAX_BODY_PREVIEW_LENGTH) {
    return {
      bodyPreview: sanitized,
      bodyWasJson,
      bodyTruncated: false,
    };
  }

  return {
    bodyPreview: sanitized.slice(0, MAX_BODY_PREVIEW_LENGTH),
    bodyWasJson,
    bodyTruncated: true,
  };
};

export const saveX402Response = async ({
  accountId,
  paymentId,
  live,
  status,
  headers,
  body,
}: {
  accountId: string;
  paymentId: string;
  live: boolean;
  status: number;
  headers: Headers;
  body: string;
}) => {
  const safeHeaders = filterHeaders(headers);
  const contentType = safeHeaders["content-type"];
  const { bodyPreview, bodyTruncated, bodyWasJson } = buildBodyPreview({
    body,
    contentType,
  });

  return saveX402ResponseEntity({
    accountId,
    response: {
      payment_id: paymentId,
      live,
      status,
      headers: safeHeaders,
      ...(contentType ? { content_type: contentType } : {}),
      body_preview: bodyPreview,
      body_truncated: bodyTruncated,
      body_was_json: bodyWasJson,
      saved_at: new Date(),
    },
  });
};
