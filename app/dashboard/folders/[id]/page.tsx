import { DashboardClient } from "@/components/dashboard-client";

type FolderDashboardPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FolderDashboardPage({
  params,
}: FolderDashboardPageProps) {
  const { id } = await params;

  return (
    <div style={{ paddingTop: 60 }}>
      <DashboardClient initialFolderId={id} />
    </div>
  );
}
