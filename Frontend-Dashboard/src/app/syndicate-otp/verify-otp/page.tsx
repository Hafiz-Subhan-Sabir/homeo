import AuthScreen from "@/components/syndicate-otp/AuthScreen";

type PageProps = {
  searchParams: Promise<{ email?: string; flow?: string }>;
};

export default async function SyndicateOtpVerifyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const flow = params.flow === "signup" ? "signup" : "login";
  return <AuthScreen mode="otp" prefilledEmail={email} otpFlow={flow} />;
}
