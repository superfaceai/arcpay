import { err, ok } from "@/lib";

import { GetCheckoutSession } from "@/acp-checkouts/interfaces";
import { GetCheckoutSessionResponse } from "@/acp-checkouts/interfaces/schema";

import { parseErrorResponse } from "./parse-error-response";

export const getCheckoutSession: GetCheckoutSession = async ({
  acpUrl,
  checkoutSessionId,
}) => {
  const response = await fetch(
    `${acpUrl}/checkout_sessions/${checkoutSessionId}`,
    { method: "GET" }
  );

  if (!response.ok) {
    return err(await parseErrorResponse(response));
  }

  const responseBody = await response.json();

  const parsedResponse = GetCheckoutSessionResponse.safeParse(responseBody);

  if (!parsedResponse.success) {
    console.error(responseBody);
    console.error(parsedResponse.error);
    return err({
      type: "GeneralACPRequestError",
      message: "The ACP server returned an invalid response",
    });
  }

  return ok(parsedResponse.data);
};
