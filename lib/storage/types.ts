import type { Readable } from "node:stream";

export type StorageMode = "local" | "mock" | "blob" | "shelby";
export type StorageProviderName = "local" | "blob" | "shelby";
export type StorageIntegrationState =
  | "active"
  | "scaffolded"
  | "ready_for_credentials"
  | "not_configured";

export interface UploadFileInput {
  blobKey: string;
  buffer: Buffer;
  mimeType: string;
}

export interface StoredObjectMetadata {
  provider: StorageProviderName;
  blobKey: string;
  mimeType?: string;
  byteLength?: number;
  etag?: string | null;
  checksum?: string | null;
  version?: string | null;
}

export interface UploadFileResult {
  provider: StorageProviderName;
  blobKey: string;
  metadata?: Record<string, unknown>;
}

export interface DownloadFileResult {
  buffer: Buffer;
  metadata: StoredObjectMetadata;
}

export interface FileStreamResult {
  stream: Readable;
  metadata: StoredObjectMetadata;
}

export interface FileRangeResult {
  stream: Readable;
  totalSize: number;
  contentLength: number;
  start: number;
  end: number;
  metadata: StoredObjectMetadata;
}

export interface StorageAdapterDescriptor {
  name: string;
  mode: StorageMode;
  provider: StorageProviderName;
  implemented: boolean;
  configured: boolean;
  integrationState: StorageIntegrationState;
  supportsByteRanges: boolean;
  supportsListing: boolean;
  supportsMetadata: boolean;
  maxUploadBytes?: number;
  notes?: string;
  reason?: string;
}

export interface StorageAdapter {
  readonly descriptor: StorageAdapterDescriptor;
  uploadFile(input: UploadFileInput): Promise<UploadFileResult>;
  downloadFile(blobKey: string): Promise<DownloadFileResult>;
  getFileStream(blobKey: string): Promise<FileStreamResult>;
  getFileRange(blobKey: string, start: number, end: number): Promise<FileRangeResult>;
  deleteFile(blobKey: string): Promise<void>;
  listFiles(prefix?: string): Promise<string[]>;
  getMetadata(blobKey: string): Promise<StoredObjectMetadata>;
}
