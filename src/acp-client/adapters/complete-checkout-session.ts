import { err, ok } from "@/lib";

import { CompleteCheckoutSession } from "@/acp-client/interfaces";
import { CompleteCheckoutSessionResponse } from "@/acp-client/interfaces/schema";

import { parseErrorResponse } from "./parse-error-response";

export const completeCheckoutSession: CompleteCheckoutSession = async ({
  acpUrl,
  checkoutSessionId,
  request,
}) => {
  const response = await fetch(
    `${acpUrl}/checkout_sessions/${checkoutSessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) return err(await parseErrorResponse(response));

  const responseBody = await response.json();

  const parsedResponse =
    CompleteCheckoutSessionResponse.safeParse(responseBody);

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
