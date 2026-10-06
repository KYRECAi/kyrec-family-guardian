import { createFileRoute, Navigate, notFound } from "@tanstack/react-router";
import { COMPANION_LORE, type CompanionId } from "@/lib/companions";

const IDS = Object.keys(COMPANION_LORE) as CompanionId[];

export const Route = createFileRoute("/talk/$id")({
  component: TalkPage,
  loader: ({ params }) => {
    const id = params.id as CompanionId;
    if (!IDS.includes(id)) throw notFound();
    return id;
  },
});

function TalkPage() {
  const id = Route.useLoaderData();
  return <Navigate to="/companions/$id" params={{ id }} />;
}
