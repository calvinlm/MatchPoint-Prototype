import { redirect } from "next/navigation";

type PageProps = {
  params: { slug: string };
};

export default function TournamentRootPage({ params }: PageProps) {
  redirect(`/t/${params.slug}/overview`);
}
