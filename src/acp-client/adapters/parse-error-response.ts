import {
  ACPErrorResponse,
  GeneralACPRequestError,
} from "@/acp-client/interfaces";

export async function parseErrorResponse(
  response: Response
): Promise<ACPErrorResponse | GeneralACPRequestError> {
  const plaintextBody = await response.text();

  const responseBody = (function () {
    try {
      return { isJson: true, data: JSON.parse(plaintextBody) };
    } catch (e) {
      return { isJson: false, data: plaintextBody };
    }
  })();

  if (!responseBody.isJson)
    return {
      type: "GeneralACPRequestError",
      message: `ACP request failed with status ${response.status}: ${plaintextBody}`,
    };

  //
  if ("type" in responseBody.data && "message" in responseBody.data) {
    return {
      type: "ACPErrorResponse",
      error: responseBody.data,
    };
  } else {
    return {
      type: "GeneralACPRequestError",
      message: `ACP request failed with status ${response.status}: ${plaintextBody}`,
    };
  }
}
