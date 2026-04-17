import AuthScreen from "@/components/syndicate-otp/AuthScreen";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function SyndicateOtpSignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return <AuthScreen mode="signup" prefilledEmail={email} />;
}
