import AuthScreen from "@/components/syndicate-otp/AuthScreen";
import RedirectWhenAuthed from "@/components/syndicate-otp/RedirectWhenAuthed";

type PageProps = {
  searchParams: Promise<{ email?: string; playlist_id?: string }>;
};

export default async function SignupPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";
  const playlistId = typeof params.playlist_id === "string" ? params.playlist_id : "";
  const fromPlaylistUnlock = playlistId.trim().length > 0;
  return (
    <div id="syndicate-otp-mount" className="min-h-dvh">
      {!fromPlaylistUnlock ? <RedirectWhenAuthed /> : null}
      <AuthScreen mode="signup" prefilledEmail={email} prefilledPlaylistId={playlistId} />
    </div>
  );
}
