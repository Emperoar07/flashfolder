export type AptosErrorCode =
  | "NOT_CONFIGURED"
  | "NOT_IMPLEMENTED"
  | "INVALID_SIGNATURE"
  | "SESSION_EXPIRED"
  | "UNSUPPORTED_NETWORK"
  | "NFT_NOT_FOUND"
  | "OWNERSHIP_VERIFICATION_FAILED"
  | "PROVIDER_UNAVAILABLE"
  | "WALLET_NOT_CONNECTED";

export class AptosIntegrationError extends Error {
  code: AptosErrorCode;
  status: number;
  exposeMessage: boolean;

  constructor(
    code: AptosErrorCode,
    message: string,
    options?: {
      status?: number;
      exposeMessage?: boolean;
      cause?: unknown;
    },
  ) {
    super(message);
    this.name = "AptosIntegrationError";
    this.code = code;
    this.status = options?.status ?? 500;
    this.exposeMessage = options?.exposeMessage ?? true;

    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function isAptosIntegrationError(
  error: unknown,
): error is AptosIntegrationError {
  return error instanceof AptosIntegrationError;
}

export function toAptosResponse(error: unknown, fallbackMessage: string) {
  if (isAptosIntegrationError(error)) {
    return {
      message: error.exposeMessage ? error.message : fallbackMessage,
      status: error.status,
      code: error.code,
    };
  }

  return {
    message: error instanceof Error ? error.message : fallbackMessage,
    status: 500,
    code: "PROVIDER_UNAVAILABLE" as const,
  };
}
