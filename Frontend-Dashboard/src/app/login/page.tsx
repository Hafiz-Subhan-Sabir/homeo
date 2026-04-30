import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{ email?: string; plan?: string; billing?: string; amount?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const selectedPlan = typeof params.plan === "string" ? params.plan : "";
  const selectedBilling = typeof params.billing === "string" ? params.billing : "";
  const selectedAmount = typeof params.amount === "string" ? params.amount : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <RedirectWhenAuthed />
      <AuthScreen
        mode="login"
        prefilledEmail={email}
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        selectedAmount={selectedAmount}
      />
    </div>
  );
}
