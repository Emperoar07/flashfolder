import { VaultAssetClient } from "@/components/vault-asset-client";

type VaultAssetPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VaultAssetPage({
  params,
}: VaultAssetPageProps) {
  const { id } = await params;

  return (
    <main className="mx-auto max-w-[1600px] px-6 pb-16 sm:px-8" style={{ paddingTop: 80 }}>
      <VaultAssetClient vaultAssetId={id} />
    </main>
  );
}
