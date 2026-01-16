import { err, ok } from "@/lib";

import { UpdateCheckoutSession } from "@/ucp-checkouts/interfaces";
import { CheckoutResponse } from "@/ucp/interfaces";

import { parseErrorResponse } from "./parse-error-response";

export const updateCheckoutSession: UpdateCheckoutSession = async ({
  ucpUrl,
  profileUrl,
  checkoutSessionId,
  request,
}) => {
  const response = await fetch(
    `${ucpUrl}/checkout-sessions/${checkoutSessionId}`,
    {
      method: "PUT",
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
    console.error(responseBody);
    console.error(parsedResponse.error);
    return err({
      type: "GeneralUCPRequestError",
      message: "The merchant UCP server returned an invalid response",
    });
  }

  return ok(parsedResponse.data);
};

