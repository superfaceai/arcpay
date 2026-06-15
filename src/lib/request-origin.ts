type RequestOriginContext = {
  req: {
    url: string;
    header: (name: string) => string | undefined;
  };
};

export const getRequestOrigin = (c: RequestOriginContext): string => {
  const requestUrl = new URL(c.req.url);
  const forwarded = parseForwardedHeader(firstHeaderValue(c.req.header("forwarded")));

  const proto =
    firstHeaderValue(c.req.header("x-forwarded-proto")) ??
    forwarded.proto ??
    requestUrl.protocol.replace(/:$/, "");

  const host =
    firstHeaderValue(c.req.header("x-forwarded-host")) ??
    forwarded.host ??
    c.req.header("host") ??
    requestUrl.host;

  return `${proto}://${host}`;
};

const firstHeaderValue = (value: string | undefined): string | undefined => {
  const firstValue = value?.split(",")[0]?.trim();
  return firstValue || undefined;
};

const parseForwardedHeader = (
  value: string | undefined,
): { proto?: string; host?: string } => {
  if (!value) return {};

  return Object.fromEntries(
    value
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key, partValue]) => key && partValue)
      .map(([key, partValue]) => [
        key.toLowerCase(),
        partValue.replace(/^\"|\"$/g, ""),
      ]),
  );
};
