import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{ email?: string; flow?: string }>;
};

export default async function VerifyOtpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const flow = params.flow === "signup" ? "signup" : "login";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <RedirectWhenAuthed />
      <AuthScreen mode="otp" prefilledEmail={email} otpFlow={flow} />
    </div>
  );
}
