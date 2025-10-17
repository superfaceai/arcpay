import { generateId } from "@/lib";
import { requestId } from "hono/request-id";

export const REQUEST_ID_HEADER = "X-Request-Id";

export const withRequestId = () =>
  requestId({
    headerName: REQUEST_ID_HEADER,
    generator: () => generateId("req", 28),
  });
