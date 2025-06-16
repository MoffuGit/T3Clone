import Thread from "./thread";

export default async function ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <Thread slug={slug} />;
}
