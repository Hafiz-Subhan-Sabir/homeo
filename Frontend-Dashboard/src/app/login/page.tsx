import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <RedirectWhenAuthed />
      <AuthScreen mode="login" prefilledEmail={email} />
    </div>
  );
}
