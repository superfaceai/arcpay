import { err, ok } from "@/lib";

import { CancelCheckoutSession } from "@/acp-checkouts/interfaces";
import { CancelCheckoutSessionResponse } from "@/acp-checkouts/interfaces/schema";

import { parseErrorResponse } from "./parse-error-response";

export const cancelCheckoutSession: CancelCheckoutSession = async ({
  acpUrl,
  checkoutSessionId,
}) => {
  const response = await fetch(
    `${acpUrl}/checkout_sessions/${checkoutSessionId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 405) {
      return err({
        type: "GeneralACPRequestError",
        message:
          "The checkout session cannot be canceled (already completed or canceled)",
      });
    }
    return err(await parseErrorResponse(response));
  }

  const responseBody = await response.json();

  const parsedResponse = CancelCheckoutSessionResponse.safeParse(responseBody);

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
