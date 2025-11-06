import { Result } from "@/lib";

import {
  CancelCheckoutSessionResponse,
  CompleteCheckoutSessionRequest,
  CompleteCheckoutSessionResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  GetCheckoutSessionResponse,
  ResponseError,
  UpdateCheckoutSessionRequest,
  UpdateCheckoutSessionResponse,
} from "./schema";

export interface ACPErrorResponse {
  readonly type: "ACPErrorResponse";
  readonly error: ResponseError;
}

export interface GeneralACPRequestError {
  readonly type: "GeneralACPRequestError";
  readonly message: string;
}

export type CreateCheckoutSession = (params: {
  acpUrl: string;
  request: CreateCheckoutSessionRequest;
}) => Promise<
  Result<
    CreateCheckoutSessionResponse,
    ACPErrorResponse | GeneralACPRequestError
  >
>;

export type UpdateCheckoutSession = (params: {
  acpUrl: string;
  checkoutSessionId: string;
  request: UpdateCheckoutSessionRequest;
}) => Promise<
  Result<
    UpdateCheckoutSessionResponse,
    ACPErrorResponse | GeneralACPRequestError
  >
>;

export type CompleteCheckoutSession = (params: {
  acpUrl: string;
  checkoutSessionId: string;
  request: CompleteCheckoutSessionRequest;
}) => Promise<
  Result<
    CompleteCheckoutSessionResponse,
    ACPErrorResponse | GeneralACPRequestError
  >
>;

export type CancelCheckoutSession = (params: {
  acpUrl: string;
  checkoutSessionId: string;
}) => Promise<
  Result<
    CancelCheckoutSessionResponse,
    ACPErrorResponse | GeneralACPRequestError
  >
>;

export type GetCheckoutSession = (params: {
  acpUrl: string;
  checkoutSessionId: string;
}) => Promise<
  Result<GetCheckoutSessionResponse, ACPErrorResponse | GeneralACPRequestError>
>;
