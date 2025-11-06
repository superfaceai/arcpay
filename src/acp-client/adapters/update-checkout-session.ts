import { err, ok } from "@/lib";

import { UpdateCheckoutSession } from "@/acp-client/interfaces";
import { UpdateCheckoutSessionResponse } from "@/acp-client/interfaces/schema";

import { parseErrorResponse } from "./parse-error-response";

export const updateCheckoutSession: UpdateCheckoutSession = async ({
  acpUrl,
  checkoutSessionId,
  request,
}) => {
  const response = await fetch(
    `${acpUrl}/checkout_sessions/${checkoutSessionId}`,
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

  const parsedResponse = UpdateCheckoutSessionResponse.safeParse(responseBody);

  if (!parsedResponse.success)
    return err({
      type: "GeneralACPRequestError",
      message: "The ACP server returned an invalid response",
    });

  return ok(parsedResponse.data);
};
