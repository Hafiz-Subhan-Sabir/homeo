import { redirect } from "next/navigation";
import AffiliateAuthScreen from "@/components/affiliate/AffiliateAuthScreen";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AffiliateLoginVerifyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email.trim() : "";
  if (!email) {
    redirect("/affiliate-login");
  }
  return <AffiliateAuthScreen mode="otp" prefilledEmail={email} />;
}
