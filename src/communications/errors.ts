export interface TransactionalSMSError {
  readonly type: "TransactionalSMSError";
  readonly message: string;
}

export interface TransactionalEmailError {
  readonly type: "TransactionalEmailError";
  readonly message: string;
}
