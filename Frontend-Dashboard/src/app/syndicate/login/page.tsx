import { connection } from "next/server";

import { syndicateNextPathFromSearch } from "@/lib/syndicateNextPath";

import { SyndicateLoginForm } from "./login-form";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function SyndicateLoginPage({ searchParams }: PageProps) {
  await connection();
  const sp = await searchParams;
  const nextPath = syndicateNextPathFromSearch(sp.next);
  return <SyndicateLoginForm nextPath={nextPath} />;
}
