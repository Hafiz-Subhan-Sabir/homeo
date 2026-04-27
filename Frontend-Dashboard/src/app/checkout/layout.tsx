import "../syndicate-otp/syndicate-otp.css";

export default function CheckoutBranchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      {children}
    </div>
  );
}
