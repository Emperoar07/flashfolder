import { ShareClient } from "@/components/share-client";

type SharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  return (
    <main className="mx-auto max-w-4xl px-6 pb-16 pt-12 sm:px-8">
      <ShareClient token={token} />
    </main>
  );
}
