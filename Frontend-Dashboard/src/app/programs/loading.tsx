export default function LoadingPrograms() {
  return (
    <div className="min-h-[100dvh] w-full bg-black">
      <div className="h-[69px] w-full" />
      <div className="mx-auto w-full max-w-[96rem] px-4 py-10 sm:px-6">
        <div className="h-8 w-36 animate-pulse rounded bg-zinc-800/80" />
        <div className="mt-4 h-12 w-72 animate-pulse rounded bg-zinc-800/70" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-900/70" />
      </div>
    </div>
  )
}
