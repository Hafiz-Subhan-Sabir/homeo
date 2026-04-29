import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'
import { PlaylistCardsSection } from '@/components/programs/PlaylistCardsSection'

export default function ProgramsPage() {
  return (
    <div className="relative min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[10%] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-[120px] sm:h-[520px] sm:w-[520px]" />
        <div className="absolute right-[-8%] top-[38%] h-[300px] w-[300px] rounded-full bg-amber-400/20 blur-[110px] sm:h-[460px] sm:w-[460px]" />
        <div className="absolute bottom-[-10%] left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-400/15 blur-[130px] sm:h-[560px] sm:w-[560px]" />
      </div>
      <NavApp />
      <section className="relative flex h-[58dvh] min-h-[420px] w-full min-w-0 items-center overflow-hidden border-b border-pink-300/20 px-[clamp(1rem,3.2vw,1.5rem)] py-[clamp(2.5rem,5vw,5rem)] sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <iframe
            src="https://player.vimeo.com/video/988922121?muted=1&autoplay=1&loop=1&background=1&app_id=122963"
            className="absolute left-1/2 top-0 h-[max(100%,56.25vw)] w-[max(100%,177.78vh)] -translate-x-1/2 scale-[1.15]"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Programs background video"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#150412]/78 to-[#02050b]/90" />
          <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-fuchsia-400/25 blur-[95px] mix-blend-screen sm:h-80 sm:w-80" />
          <div className="absolute right-[-4rem] top-1/3 h-72 w-72 rounded-full bg-yellow-400/20 blur-[105px] mix-blend-screen sm:h-96 sm:w-96" />
          <div className="absolute bottom-[-4rem] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-300/20 blur-[100px] mix-blend-screen sm:h-80 sm:w-80" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1400px] text-center">
          <p className="text-xs uppercase tracking-[0.24em] text-pink-200/80">Programs Library</p>
          <h1 className="mt-3 text-3xl font-bold text-[#fdd02f] sm:text-4xl md:text-5xl">Pick your current growth path</h1>
          <p className="mx-auto mt-5 max-w-5xl text-base leading-relaxed text-pink-50/95 drop-shadow-[0_0_10px_rgba(244,114,182,0.2)] sm:text-lg">
            Choose a focused training track based on your current bottleneck and expand into advanced systems over time. Start with one playlist, build
            execution momentum, and unlock practical frameworks you can apply immediately to business, money, and influence. Each program is structured to
            help you move from confusion to clarity with step-by-step implementation, so you can take action faster and stay consistent. As you progress,
            you will compound skills, improve decision-making, and build a stronger foundation for long-term growth.
          </p>
        </div>
      </section>
      <section className="px-[clamp(1rem,3.2vw,1.5rem)] py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-[1400px]">
          <PlaylistCardsSection
            title="Programs Library"
            subtitle="Explore all admin-published playlists here. Playlist videos stay inside member dashboard."
          />
        </div>
      </section>
      <GlobalBottomSections />
    </div>
  )
}
