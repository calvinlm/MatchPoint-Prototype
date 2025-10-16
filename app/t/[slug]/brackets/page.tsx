import BracketsClient from "./bracketsClient";
import { fetchPublicBrackets } from "../data";

type PageProps = {
  params: { slug: string };
};

export default async function BracketsPage({ params }: PageProps) {
  const { slug } = params;
  const brackets = await fetchPublicBrackets(slug);
  return <BracketsClient slug={slug} initialBrackets={brackets} />;
}
