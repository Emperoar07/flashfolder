"use client";

import { UploadCloud } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  onSelectFile: (file: File | null) => void;
  selectedFile: File | null;
};

export function UploadDropzone({
  onSelectFile,
  selectedFile,
}: UploadDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onSelectFile(acceptedFiles[0] ?? null);
    },
    [onSelectFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    onDrop,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "rounded-[2rem] border border-dashed px-6 py-10 text-center transition",
        isDragActive
          ? "border-[#c8392b] bg-[rgba(200,57,43,0.08)]"
          : "border-[rgba(200,57,43,0.3)] bg-[rgba(200,57,43,0.02)] hover:border-[#c8392b]",
      )}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c8392b] text-[#f0ede6]">
        <UploadCloud className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-[#f0ede6]">
        Drop a file here or click to browse
      </p>
      <p className="mt-2 text-sm text-[rgba(240,237,230,0.35)]">
        {selectedFile
          ? `Selected: ${selectedFile.name}`
          : "Images, videos, audio, PDFs, and text files preview best."}
      </p>
    </div>
  );
}
