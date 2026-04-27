import { redirect } from "next/navigation";
import { syndicateOtpSignupHref } from "@/lib/syndicate-otp-paths";

export default function CheckoutEntryPage() {
  redirect(syndicateOtpSignupHref());
}
