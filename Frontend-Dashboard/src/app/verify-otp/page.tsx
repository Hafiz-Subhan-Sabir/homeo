import AuthScreen from "@/components/syndicate-otp/AuthScreen";

type PageProps = {
  searchParams: Promise<{ email?: string; flow?: string; plan?: string; billing?: string; amount?: string }>;
};

export default async function VerifyOtpPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const flow = params.flow === "signup" ? "signup" : "login";
  const selectedPlan = typeof params.plan === "string" ? params.plan : "";
  const selectedBilling = typeof params.billing === "string" ? params.billing : "";
  const selectedAmount = typeof params.amount === "string" ? params.amount : "";
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      <AuthScreen
        mode="otp"
        prefilledEmail={email}
        otpFlow={flow}
        selectedPlan={selectedPlan}
        selectedBilling={selectedBilling}
        selectedAmount={selectedAmount}
      />
    </div>
  );
}
