export default function LoadingWhatYouGet() {
  return (
    <div className="min-h-[100dvh] w-full bg-black">
      <div className="h-[69px] w-full" />
      <div className="mx-auto w-full max-w-[96rem] px-4 py-10 sm:px-6">
        <div className="h-8 w-44 animate-pulse rounded bg-zinc-800/80" />
        <div className="mt-4 h-12 w-96 animate-pulse rounded bg-zinc-800/70" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-900/70" />
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-900/70" />
          <div className="h-48 animate-pulse rounded-2xl bg-zinc-900/70" />
        </div>
      </div>
    </div>
  )
}
