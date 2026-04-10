import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Syndicate Access",
  description: "Login or sign up to access Syndicate mode."
};

/** Never static-prerender this subtree (avoids CSR bailout / useSearchParams-class errors on hosts like Railway). */
export const dynamic = "force-dynamic";

export default function SyndicateAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full min-w-0 items-center justify-center bg-[#060606] px-3 py-8 text-white pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-4 sm:py-10 sm:pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-md min-w-0 sm:max-w-lg md:max-w-xl">{children}</div>
    </div>
  );
}
