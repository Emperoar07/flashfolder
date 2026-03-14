export type StorageErrorCode =
  | "NOT_CONFIGURED"
  | "NOT_IMPLEMENTED"
  | "NOT_FOUND"
  | "INVALID_RANGE"
  | "UNAUTHORIZED"
  | "UNAVAILABLE"
  | "UPLOAD_FAILED"
  | "DOWNLOAD_FAILED"
  | "DELETE_FAILED";

export class StorageError extends Error {
  code: StorageErrorCode;
  status: number;
  exposeMessage: boolean;

  constructor(
    code: StorageErrorCode,
    message: string,
    options?: {
      cause?: unknown;
      status?: number;
      exposeMessage?: boolean;
    },
  ) {
    super(message);
    this.name = "StorageError";
    this.code = code;
    this.status = options?.status ?? 500;
    this.exposeMessage = options?.exposeMessage ?? true;

    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

export function toStorageResponse(error: unknown, fallbackMessage: string) {
  if (isStorageError(error)) {
    return {
      message: error.exposeMessage ? error.message : fallbackMessage,
      status: error.status,
      code: error.code,
    };
  }

  return {
    message: error instanceof Error ? error.message : fallbackMessage,
    status: 500,
    code: "UNAVAILABLE" as const,
  };
}
