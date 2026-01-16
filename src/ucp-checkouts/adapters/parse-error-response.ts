import {
  UCPErrorResponse,
  GeneralUCPRequestError,
} from "@/ucp-checkouts/interfaces";

export async function parseErrorResponse(
  response: Response
): Promise<UCPErrorResponse | GeneralUCPRequestError> {
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
      type: "GeneralUCPRequestError",
      message: `UCP request failed with status ${response.status}: ${plaintextBody}`,
    };

  //
  if ("status" in responseBody.data && "messages" in responseBody.data) {
    return {
      type: "UCPErrorResponse",
      error: responseBody.data,
    };
  } else {
    return {
      type: "GeneralUCPRequestError",
      message: `UCP request failed with status ${response.status}: ${plaintextBody}`,
    };
  }
}
