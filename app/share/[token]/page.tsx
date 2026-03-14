import { ShareClient } from "@/components/share-client";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  return (
    <div style={{ paddingTop: 60 }}>
      <ShareClient token={token} />
    </div>
  );
}
