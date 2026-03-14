import Image from "next/image";

import { PreviewType } from "@prisma/client";

type FilePreviewProps = {
  fileId: string;
  originalName: string;
  previewType: PreviewType;
  token?: string;
  password?: string;
};

export function FilePreview({
  fileId,
  originalName,
  previewType,
  token,
  password,
}: FilePreviewProps) {
  const query = new URLSearchParams({
    inline: "1",
    ...(token ? { token } : {}),
    ...(password ? { password } : {}),
  });
  const src = `/api/files/${fileId}/download?${query.toString()}`;

  if (previewType === PreviewType.IMAGE) {
    return (
      <Image
        src={src}
        alt={originalName}
        className="h-72 w-full rounded-3xl object-cover"
        height={720}
        unoptimized
        width={1280}
      />
    );
  }

  if (previewType === PreviewType.VIDEO) {
    return (
      <video className="h-72 w-full rounded-3xl bg-slate-950 object-cover" controls>
        <source src={src} />
      </video>
    );
  }

  if (previewType === PreviewType.AUDIO) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <audio className="w-full" controls>
          <source src={src} />
        </audio>
      </div>
    );
  }

  if (previewType === PreviewType.PDF) {
    return (
      <iframe
        className="h-96 w-full rounded-3xl border border-slate-200 bg-white"
        src={src}
        title={originalName}
      />
    );
  }

  return (
    <iframe
      className="h-96 w-full rounded-3xl border border-slate-200 bg-white"
      src={src}
      title={originalName}
    />
  );
}
