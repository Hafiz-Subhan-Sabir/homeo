import AffiliateAuthScreen from "@/components/affiliate/AffiliateAuthScreen";

type PageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function AffiliateLoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  return <AffiliateAuthScreen mode="email" prefilledEmail={email} />;
}
