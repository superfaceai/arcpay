import { err, ok } from "@/lib";

import { CreateCheckoutSession } from "@/acp-client/interfaces";
import { CreateCheckoutSessionResponse } from "@/acp-client/interfaces/schema";

import { parseErrorResponse } from "./parse-error-response";

export const createCheckoutSession: CreateCheckoutSession = async ({
  acpUrl,
  request,
}) => {
  const response = await fetch(`${acpUrl}/checkout_sessions`, {
    method: "POST",
    body: JSON.stringify(request),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) return err(await parseErrorResponse(response));

  const responseBody = await response.json();

  const parsedResponse = CreateCheckoutSessionResponse.safeParse(responseBody);

  if (!parsedResponse.success)
    return err({
      type: "GeneralACPRequestError",
      message: "The ACP server returned an invalid response",
    });

  return ok(parsedResponse.data);
};
