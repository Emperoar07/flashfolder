import Image from "next/image";

import { PREVIEW_TYPES, type PreviewTypeValue } from "@/lib/file-kinds";

type FilePreviewProps = {
  fileId?: string;
  originalName: string;
  previewType: PreviewTypeValue;
  token?: string;
  password?: string;
  src?: string;
};

export function FilePreview({
  fileId,
  originalName,
  previewType,
  token,
  password,
  src,
}: FilePreviewProps) {
  const previewSrc =
    src ??
    (() => {
      if (!fileId) return "";
      const query = new URLSearchParams({
        inline: "1",
        ...(token ? { token } : {}),
        ...(password ? { password } : {}),
      });
      return `/api/files/${fileId}/download?${query.toString()}`;
    })();

  if (previewType === PREVIEW_TYPES.IMAGE) {
    return (
      <Image
        src={previewSrc}
        alt={originalName}
        className="h-72 w-full rounded-3xl object-cover"
        height={720}
        unoptimized
        width={1280}
      />
    );
  }

  if (previewType === PREVIEW_TYPES.VIDEO) {
    return (
      <video className="h-72 w-full rounded-3xl bg-slate-950 object-cover" controls>
        <source src={previewSrc} />
      </video>
    );
  }

  if (previewType === PREVIEW_TYPES.AUDIO) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <audio className="w-full" controls>
          <source src={previewSrc} />
        </audio>
      </div>
    );
  }

  if (previewType === PREVIEW_TYPES.PDF) {
    return (
      <iframe
        className="h-96 w-full rounded-3xl border border-slate-200 bg-white"
        src={previewSrc}
        title={originalName}
      />
    );
  }

  return (
    <iframe
      className="h-96 w-full rounded-3xl border border-slate-200 bg-white"
      src={previewSrc}
      title={originalName}
    />
  );
}
