import { TopologyDetail } from "@/components/topology-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TopologyDetail id={id} />;
}
