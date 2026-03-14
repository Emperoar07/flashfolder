import type { Readable } from "node:stream";

export interface UploadFileInput {
  blobKey: string;
  buffer: Buffer;
  mimeType: string;
}

export interface FileRangeResult {
  stream: Readable;
  totalSize: number;
  contentLength: number;
}

export interface StorageAdapter {
  readonly name: string;
  readonly mode: "local" | "shelby";
  uploadFile(input: UploadFileInput): Promise<void>;
  downloadFile(blobKey: string): Promise<Buffer>;
  getFileStream(blobKey: string): Promise<Readable>;
  getFileRange(blobKey: string, start: number, end: number): Promise<FileRangeResult>;
  deleteFile(blobKey: string): Promise<void>;
  listFiles(prefix?: string): Promise<string[]>;
}
