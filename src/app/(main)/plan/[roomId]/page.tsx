import { PlanPageView } from "../_components";

interface Props {
  params: Promise<{ roomId: string }>;
}

export default async function PlanRoomPage({ params }: Props) {
  const { roomId } = await params;
  return <PlanPageView roomId={roomId} />;
}
