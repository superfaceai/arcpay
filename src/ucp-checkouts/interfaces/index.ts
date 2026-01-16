import { Result } from "@/lib";

import {
  CheckoutCreateRequest,
  CheckoutUpdateRequest,
  CheckoutResponse,
  PaymentData,
  CheckoutCompleteRequest,
} from "@/ucp/interfaces";

export interface UCPErrorResponse {
  readonly type: "UCPErrorResponse";
  readonly error: {
    type: string;
    code: string;
    message: string;
    path?: string;
  };
}

export interface GeneralUCPRequestError {
  readonly type: "GeneralUCPRequestError";
  readonly message: string;
}

export interface MinimalUCPReport {
  readonly type: "MinimalUCPReport";
  readonly checkoutStatus: string;
  readonly message: string;
}

export type CreateCheckoutSession = (params: {
  ucpUrl: string;
  profileUrl: string;
  request: CheckoutCreateRequest;
}) => Promise<
  Result<CheckoutResponse, UCPErrorResponse | GeneralUCPRequestError>
>;

export type UpdateCheckoutSession = (params: {
  ucpUrl: string;
  profileUrl: string;
  checkoutSessionId: string;
  request: CheckoutUpdateRequest;
}) => Promise<
  Result<CheckoutResponse, UCPErrorResponse | GeneralUCPRequestError>
>;

export type CompleteCheckoutSession = (params: {
  ucpUrl: string;
  profileUrl: string;
  checkoutSessionId: string;
  request: CheckoutCompleteRequest;
}) => Promise<
  Result<
    CheckoutResponse,
    UCPErrorResponse | GeneralUCPRequestError | MinimalUCPReport
  >
>;

export type CancelCheckoutSession = (params: {
  ucpUrl: string;
  profileUrl: string;
  checkoutSessionId: string;
}) => Promise<
  Result<CheckoutResponse, UCPErrorResponse | GeneralUCPRequestError>
>;

export type GetCheckoutSession = (params: {
  ucpUrl: string;
  profileUrl: string;
  checkoutSessionId: string;
}) => Promise<
  Result<CheckoutResponse, UCPErrorResponse | GeneralUCPRequestError>
>;
