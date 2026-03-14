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
          ? "border-sky-500 bg-sky-50"
          : "border-slate-300 bg-slate-50 hover:border-slate-400",
      )}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white">
        <UploadCloud className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium text-slate-900">
        Drop a file here or click to browse
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {selectedFile
          ? `Selected: ${selectedFile.name}`
          : "Images, videos, audio, PDFs, and text files preview best."}
      </p>
    </div>
  );
}
