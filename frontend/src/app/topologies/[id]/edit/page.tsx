import { TopologyEditor } from "@/components/topology-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TopologyEditor id={id} />;
}
