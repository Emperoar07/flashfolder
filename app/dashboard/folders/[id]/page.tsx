import { DashboardClient } from "@/components/dashboard-client";

type FolderDashboardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FolderDashboardPage({
  params,
}: FolderDashboardPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-[1600px] px-6 pb-16 pt-8 sm:px-8">
      <DashboardClient initialFolderId={id} />
    </main>
  );
}
