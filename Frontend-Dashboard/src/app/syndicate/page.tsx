import { redirect } from "next/navigation";

/** Syndicate auth UI was removed; deep links to /syndicate/* go to the main app. */
export default function SyndicateIndexPage() {
  redirect("/");
}
