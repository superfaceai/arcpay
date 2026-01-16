import { err, ok } from "@/lib";

import { CancelCheckoutSession } from "@/ucp-checkouts/interfaces";
import { CheckoutResponse } from "@/ucp/interfaces";

import { parseErrorResponse } from "./parse-error-response";

export const cancelCheckoutSession: CancelCheckoutSession = async ({
  ucpUrl,
  profileUrl,
  checkoutSessionId,
}) => {
  const response = await fetch(
    `${ucpUrl}/checkout-sessions/${checkoutSessionId}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "UCP-Agent": `profile="${profileUrl}"`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 405) {
      return err({
        type: "GeneralUCPRequestError",
        message:
          "The checkout session cannot be canceled (already completed or canceled)",
      });
    }
    return err(await parseErrorResponse(response));
  }

  const responseBody = await response.json();

  const parsedResponse = CheckoutResponse.safeParse(responseBody);

  if (!parsedResponse.success) {
    console.error(responseBody);
    console.error(parsedResponse.error);
    return err({
      type: "GeneralUCPRequestError",
      message: "The merchant UCP server returned an invalid response",
    });
  }

  return ok(parsedResponse.data);
};

