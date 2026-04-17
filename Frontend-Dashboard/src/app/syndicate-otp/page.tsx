import { redirect } from "next/navigation";
import { syndicateOtpLoginHref } from "@/lib/syndicate-otp-paths";

export default function SyndicateOtpIndexPage() {
  redirect(syndicateOtpLoginHref());
}
