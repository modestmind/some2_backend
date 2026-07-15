export enum TechnicalExceptionCode {
  JWT_VERIFY_FAILED = "JWT_VERIFY_FAILED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",
  EMAIL_DUPLICATED = "EMAIL_DUPLICATED",
}

export class TechnicalException extends Error {
  code: TechnicalExceptionCode;
  originalErr: unknown;

  constructor(
    message: string,
    code: TechnicalExceptionCode,
    originalErr?: unknown,
  ) {
    super(message);
    this.code = code;
    this.originalErr = originalErr;
  }
}
