import { err, ok } from "@/lib";

import { CompleteCheckoutSession } from "@/ucp-checkouts/interfaces";
import { CheckoutResponse } from "@/ucp/interfaces";

import { parseErrorResponse } from "./parse-error-response";

export const completeCheckoutSession: CompleteCheckoutSession = async ({
  ucpUrl,
  profileUrl,
  checkoutSessionId,
  request,
}) => {
  const response = await fetch(
    `${ucpUrl}/checkout-sessions/${checkoutSessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
        "UCP-Agent": `profile="${profileUrl}"`,
      },
    }
  );

  if (!response.ok) return err(await parseErrorResponse(response));

  const responseBody = await response.json();

  const parsedResponse = CheckoutResponse.safeParse(responseBody);

  if (!parsedResponse.success) {
    console.error(JSON.stringify(responseBody, null, 2));
    console.error(parsedResponse.error);

    // If parsing of the response is failed, we cannot let this bubble
    // up to AI because the payment might have been successful.
    // Let's try the best we can to at least report on the status.

    const regex = /"status"\s*:\s*"([^"]*)"/;
    const match = JSON.stringify(responseBody).match(regex);
    const status = match ? match[1] : null;

    return err({
      type: "MinimalUCPReport",
      checkoutStatus: status ?? "unknown",
      message: `The merchant UCP server returned an invalid response but the checkout status is most likely: ${
        status ?? "unknown"
      }`,
    });
  }

  return ok(parsedResponse.data);
};
