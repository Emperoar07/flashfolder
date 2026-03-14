import { FileDetailClient } from "@/components/file-detail-client";

type FilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function FilePage({ params }: FilePageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-7xl px-6 pb-16 pt-8 sm:px-8">
      <FileDetailClient fileId={id} />
    </main>
  );
}
