import { Contact } from "./entities";

export interface AccountHandleNotAvailableError {
  readonly type: "AccountHandleNotAvailableError";
  readonly handle: string;
}

export interface AccountPrimaryContactAlreadyExistsError {
  readonly type: "AccountPrimaryContactAlreadyExistsError";
  readonly contact: Contact;
}

export interface AccountContactMethodChangeError {
  readonly type: "AccountContactMethodChangeError";
}

export interface AccountContactNotAllowedError {
  readonly type: "AccountContactNotAllowedError";
  readonly message: string;
}
