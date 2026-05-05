import Link from 'next/link'
import Image from 'next/image'
import { NavApp } from '@/components/NavApp'
import GlobalBottomSections from '@/components/GlobalBottomSections'

type MethodBlock = {
  id: string
  title: string
  summary: string
  paragraphs: [string, string]
  image: string
  imageAlt: string
  accent: 'cyan' | 'violet' | 'amber'
}

const METHOD_BLOCKS: MethodBlock[] = [
  {
    id: 'greatness',
    title: 'Achieving True Greatness comes with Mastery',
    summary:
      'Greatness is engineered through discipline and strategic education, not by chance.',
    paragraphs: [
      'True greatness is not achieved by chance - it is deliberately built through knowledge, discipline, and action. The Syndicate equips its members with actionable, real-world strategies designed to help them master the systems of wealth and power.',
      'The Syndicate brings clarity to wealth systems with immediate implementation methods. Every lesson is built for practical execution from day one while preserving moral integrity and purpose.',
    ],
    image: '/assets/pawn2.png',
    imageAlt: 'Dystopian operator portrait',
    accent: 'cyan',
  },
  {
    id: 'break-free',
    title: 'BREAK FREE FROM THE SYSTEM',
    summary:
      'Reject passive compliance and build strategic autonomy through alliance and execution.',
    paragraphs: [
      'The Syndicate stands as an elite and exclusive organisation of individuals committed to achieving the zenith of power, wealth, and mastery. This private network is for those who yearn for true greatness and the ability to shape their destiny.',
      'This is not a shortcut scheme. It is a disciplined alliance for people willing to master themselves, build leverage, and reshape outcomes under pressure.',
    ],
    image: '/assets/pawn.png',
    imageAlt: 'Syndicate resistance figure',
    accent: 'amber',
  },
  {
    id: 'money-power',
    title: 'Money and Power Mastery',
    summary:
      'Money and power are inseparable systems that demand control, ethics, and strategic awareness.',
    paragraphs: [
      'The Syndicate philosophy teaches that money and power go hand in hand. They are like two sides of the same coin. Money and power, if not correctly wielded, has the potential to completely corrupt you, leading you down a dark path of corrupt, degenerate and hedonistic behaviour.',
      'The mission goes beyond accumulation. Members are trained to navigate influence structures without moral collapse, turning power into disciplined, constructive force.',
    ],
    image: '/assets/pawn1.png',
    imageAlt: 'Neon chess warrior',
    accent: 'violet',
  },
]

const METHOD_TIMELINE = [
  {
    step: '01',
    title: 'Decode The System',
    detail:
      'Map the hidden incentive structures controlling outcomes in money, influence, and status.',
    border: 'border-rose-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(244,63,94,0.82),0_0_48px_rgba(225,29,72,0.74),0_0_92px_rgba(136,19,55,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(244,63,94,0.72),rgba(190,24,93,0.66),rgba(136,19,55,0.62))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(244,63,94,0.64),rgba(136,19,55,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-rose-700/90',
    stepText: 'text-rose-200',
    titleText: 'text-rose-200',
  },
  {
    step: '02',
    title: 'Build Strategic Clarity',
    detail:
      'Convert chaos into executable frameworks with clear priorities, leverage points, and constraints.',
    border: 'border-fuchsia-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(217,70,239,0.82),0_0_48px_rgba(192,38,211,0.74),0_0_92px_rgba(134,25,143,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(217,70,239,0.74),rgba(162,28,175,0.68),rgba(126,34,206,0.64))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(217,70,239,0.64),rgba(126,34,206,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-fuchsia-700/90',
    stepText: 'text-fuchsia-200',
    titleText: 'text-fuchsia-200',
  },
  {
    step: '03',
    title: 'Execute Relentlessly',
    detail:
      'Deploy disciplined daily actions, track feedback loops, and adapt faster than competitors.',
    border: 'border-cyan-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(34,211,238,0.82),0_0_48px_rgba(6,182,212,0.74),0_0_92px_rgba(14,116,144,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(34,211,238,0.74),rgba(8,145,178,0.68),rgba(14,116,144,0.64))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(34,211,238,0.66),rgba(14,116,144,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-cyan-700/90',
    stepText: 'text-cyan-200',
    titleText: 'text-cyan-200',
  },
  {
    step: '04',
    title: 'Compound Power',
    detail:
      'Scale from isolated wins to durable systems that produce authority, capital, and autonomy.',
    border: 'border-blue-500/90',
    glow: 'shadow-[0_0_0_2px_rgba(59,130,246,0.82),0_0_48px_rgba(37,99,235,0.74),0_0_92px_rgba(30,64,175,0.58)]',
    bg: 'bg-[linear-gradient(132deg,rgba(59,130,246,0.74),rgba(37,99,235,0.68),rgba(30,64,175,0.64))]',
    aura: 'bg-[radial-gradient(90%_80%_at_50%_40%,rgba(59,130,246,0.64),rgba(30,64,175,0.5)_48%,transparent_74%)]',
    stepBorder: 'border-blue-700/90',
    stepText: 'text-blue-200',
    titleText: 'text-blue-200',
  },
] as const

export default function OurMethodsPage() {
  const accentStyles: Record<MethodBlock['accent'], { border: string; glow: string; title: string; chip: string }> = {
    cyan: {
      border: 'border-cyan-300/65',
      glow: 'shadow-[0_0_0_1px_rgba(34,211,238,0.42),0_0_70px_rgba(34,211,238,0.24)]',
      title: 'text-cyan-100',
      chip: 'text-cyan-200 border-cyan-300/70',
    },
    violet: {
      border: 'border-violet-300/65',
      glow: 'shadow-[0_0_0_1px_rgba(167,139,250,0.42),0_0_70px_rgba(167,139,250,0.24)]',
      title: 'text-violet-100',
      chip: 'text-violet-200 border-violet-300/70',
    },
    amber: {
      border: 'border-amber-300/65',
      glow: 'shadow-[0_0_0_1px_rgba(245,158,11,0.36),0_0_70px_rgba(245,158,11,0.2)]',
      title: 'text-amber-100',
      chip: 'text-amber-200 border-amber-300/70',
    },
  }

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-clip bg-black">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-25"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/assets/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute left-[-10%] top-[8%] h-[400px] w-[400px] rounded-full bg-cyan-400/18 blur-[140px]" />
        <div className="absolute right-[-12%] top-[14%] h-[440px] w-[440px] rounded-full bg-violet-500/20 blur-[150px]" />
        <div className="absolute left-[36%] top-[54%] h-[500px] w-[500px] rounded-full bg-rose-500/10 blur-[160px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.24)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.2)_1px,transparent_1px),linear-gradient(rgba(167,139,250,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(167,139,250,0.14)_1px,transparent_1px)] [background-size:74px_74px,74px_74px,18px_18px,18px_18px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(56,189,248,0.1),transparent_58%),radial-gradient(ellipse_90%_80%_at_50%_100%,rgba(244,63,94,0.11),transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#040816]/74 via-[#05040c]/88 to-[#020208]/96" />
      </div>

      <NavApp />

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-10 pt-[88px] sm:pb-12 sm:pt-[106px]">
        <div className="mx-auto max-w-[96rem]">
          <div className="relative min-h-[72vh] overflow-hidden rounded-[32px] border border-cyan-300/65 bg-black/45 p-7 shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_96px_rgba(34,211,238,0.26),0_0_180px_rgba(167,139,250,0.2)] sm:p-10 lg:p-14 [clip-path:polygon(24px_0,calc(100%-24px)_0,100%_24px,100%_calc(100%-24px),calc(100%-24px)_100%,24px_100%,0_calc(100%-24px),0_24px)]">
            <span className="pointer-events-none absolute inset-[8px] rounded-[22px] border border-violet-300/45" />
            <span className="pointer-events-none absolute inset-[16px] rounded-[16px] border border-cyan-200/20" />
            <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(95%_130%_at_50%_-12%,rgba(34,211,238,0.18),transparent_56%)]" />
            <span className="pointer-events-none absolute left-[6%] top-5 h-px w-[24%] bg-gradient-to-r from-transparent via-cyan-300/90 to-transparent" />
            <span className="pointer-events-none absolute right-[6%] top-5 h-px w-[24%] bg-gradient-to-r from-transparent via-violet-300/90 to-transparent" />
            <span className="pointer-events-none absolute left-5 top-5 h-12 w-12 border-l-2 border-t-2 border-cyan-300/85" />
            <span className="pointer-events-none absolute bottom-5 right-5 h-12 w-12 border-b-2 border-r-2 border-violet-300/85" />
            <div className="relative z-10 grid gap-9 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-200/80">Our Methods // Dystopian Doctrine</p>
                <h1 className="mt-4 text-[clamp(2.2rem,5.4vw,5.2rem)] font-black uppercase leading-[0.9] tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.52)]">
                  Control The
                  <br />
                  Operating System
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-100/88 sm:text-xl">
                  In a broken world, average behavior gets average outcomes. Our methods are engineered for operators who want structure, leverage, and execution inside high-pressure systems.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/login" className="cta-nav-button text-sm font-semibold">
                    Enter The Network
                  </Link>
                  <Link href="/programs" className="cta-nav-button text-sm font-semibold">
                    View Programs
                  </Link>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="relative mx-auto w-full max-w-[620px] overflow-hidden rounded-2xl border border-cyan-300/55 bg-black/45 p-2 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_0_56px_rgba(167,139,250,0.28)]">
                  <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.2),transparent_45%,rgba(167,139,250,0.2))]" />
                  <video
                    className="relative z-10 h-[360px] w-full rounded-xl object-cover sm:h-[440px] lg:h-[500px]"
                    autoPlay
                    muted
                    loop
                    playsInline
                  >
                    <source src="/assets/video.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-8 sm:pb-10">
        <div className="mx-auto max-w-[96rem]">
          <div className="relative overflow-hidden rounded-full border border-amber-300/45 bg-black/35 py-1.5 shadow-[0_0_28px_rgba(251,191,36,0.24)]">
            <svg viewBox="0 0 1200 26" className="h-5 w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <pattern id="ornate-sep" width="54" height="26" patternUnits="userSpaceOnUse">
                  <path d="M2 13h50" stroke="rgba(251,191,36,0.95)" strokeWidth="1.4" />
                  <path d="M14 6l12 7-12 7-12-7z" fill="none" stroke="rgba(245,158,11,0.95)" strokeWidth="1.2" />
                  <circle cx="26" cy="13" r="2.1" fill="rgba(250,204,21,0.96)" />
                  <path d="M8 13c5-6 11-6 16 0-5 6-11 6-16 0z" fill="none" stroke="rgba(245,158,11,0.7)" strokeWidth="1" />
                  <path d="M44 13c-5-6-11-6-16 0 5 6 11 6 16 0z" fill="none" stroke="rgba(245,158,11,0.7)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="1200" height="26" fill="url(#ornate-sep)" />
            </svg>
          </div>
        </div>
      </div>

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-10 sm:pb-12">
        <div className="mx-auto max-w-[96rem]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/85">Method Timeline</p>
            <h2 className="mt-2 text-[clamp(2rem,4.2vw,3.4rem)] font-black uppercase tracking-[0.08em] text-amber-100">
              Operational Sequence
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {METHOD_TIMELINE.map((item, idx) => (
              <article
                key={item.step}
                className={`group relative overflow-hidden rounded-2xl border-2 p-5 transition-transform duration-300 hover:-translate-y-0.5 ${
                  idx === 1
                    ? 'xl:col-span-4'
                    : idx === 2
                      ? 'xl:col-span-3'
                      : 'xl:col-span-2'
                } ${
                  idx % 2 === 0
                    ? '[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]'
                    : '[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]'
                } ${item.border} ${item.glow}`}
              >
                <span className={`pointer-events-none absolute -inset-3 rounded-[1.2rem] opacity-85 blur-2xl ${item.aura}`} />
                <span className={`pointer-events-none absolute inset-0 ${item.bg}`} />
                <span className="pointer-events-none absolute inset-0 opacity-[0.17] [background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]" />
                <span className="pointer-events-none absolute inset-0 opacity-[0.2] [background-image:linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] [background-size:16px_16px]" />
                <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" />
                <span className={`pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-[3px] border-t-[3px] ${item.stepBorder} opacity-90`} />
                <span className={`pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-[3px] border-r-[3px] ${item.stepBorder} opacity-90`} />
                <span className={`pointer-events-none absolute right-3 top-3 h-2 w-10 rounded-full ${item.stepBorder} border bg-black/45`} />
                <span className={`pointer-events-none absolute bottom-3 left-3 h-2 w-10 rounded-full ${item.stepBorder} border bg-black/45`} />
                <div className="relative z-10 rounded-lg bg-black/32 p-2.5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.28)] backdrop-blur-[1px] sm:p-3">
                  <p className={`inline-flex rounded-md border-2 bg-black/55 px-3 py-1 text-[11px] font-bold tracking-[0.24em] shadow-[0_0_16px_rgba(0,0,0,0.6)] ${item.stepBorder} text-zinc-100`}>
                    STEP {item.step}
                  </p>
                  <h3 className={`mt-3 text-2xl font-black uppercase leading-tight tracking-[0.04em] text-zinc-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)] ${item.titleText}`}>{item.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-zinc-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.68)]">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-[clamp(1rem,3vw,2.2rem)] pb-14 sm:pb-20">
        <div className="mx-auto max-w-[96rem]">
          <div className="space-y-7">
            {METHOD_BLOCKS.map((block) => {
              const isPrimary = block.id === 'greatness'
              const isMoneyPower = block.id === 'money-power'
              const isBreakFree = block.id === 'break-free'
              const cardGlow =
                block.accent === 'cyan'
                  ? 'shadow-[0_0_0_1px_rgba(34,211,238,0.4),0_0_65px_rgba(34,211,238,0.22)] border-cyan-300/60'
                  : block.accent === 'violet'
                    ? 'shadow-[0_0_0_1px_rgba(167,139,250,0.42),0_0_65px_rgba(167,139,250,0.22)] border-violet-300/60'
                    : 'shadow-[0_0_0_1px_rgba(245,158,11,0.4),0_0_65px_rgba(245,158,11,0.2)] border-amber-300/60'

              return (
                isBreakFree ? (
                <section key={block.id} className="mx-auto w-full max-w-[86rem] py-2 text-center">
                  <h3 className={`mt-4 text-[clamp(2.4rem,4.6vw,4.2rem)] font-black leading-[1] ${accentStyles[block.accent].title}`}>
                    {block.title}
                  </h3>
                  <p className="mx-auto mt-4 max-w-[62rem] text-xl leading-relaxed text-zinc-100/88 sm:text-2xl">
                    {block.summary}
                  </p>
                  <p className="mx-auto mt-6 max-w-[62rem] text-lg leading-relaxed text-zinc-100/90 sm:text-xl">
                    {block.paragraphs[0]}
                  </p>
                  <p className="mx-auto mt-4 max-w-[62rem] text-lg leading-relaxed text-zinc-100/90 sm:text-xl">
                    {block.paragraphs[1]}
                  </p>
                  <p className="mx-auto mt-6 max-w-[62rem] text-base font-semibold uppercase tracking-[0.14em] text-cyan-100/90 sm:text-lg">
                    Master yourself. Master the system.
                  </p>
                  <div className="mt-7">
                    <Link href="/login" className="cta-nav-button text-sm font-semibold">
                      Enter This Track
                    </Link>
                  </div>
                </section>
                ) : (
                <div
                  key={block.id}
                  className={isPrimary ? 'grid items-start gap-4 lg:grid-cols-[1fr_240px]' : 'grid items-start'}
                >
                  {isMoneyPower ? (
                    <div className="mb-8 mt-2 text-center">
                      <h3 className={`mt-2 text-[clamp(2.4rem,4.6vw,4.2rem)] font-black leading-[1.05] ${accentStyles[block.accent].title}`}>
                        {block.title}
                      </h3>
                    </div>
                  ) : null}
                  <article
                    className={`relative overflow-hidden rounded-[24px] border bg-black/55 p-6 sm:p-8 ${cardGlow} [clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-18px),calc(100%-18px)_100%,18px_100%,0_calc(100%-18px),0_18px)] ${isMoneyPower ? 'min-h-[430px]' : ''}`}
                  >
                    <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,rgba(34,211,238,0.14),transparent_38%,rgba(167,139,250,0.14))]" />
                    <span className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent_0px,transparent_2px,rgba(255,255,255,0.12)_2px,rgba(255,255,255,0.12)_3px)]" />
                    <span className="pointer-events-none absolute inset-[8px] rounded-[18px] border border-white/20" />
                    <span className="pointer-events-none absolute inset-[14px] rounded-[14px] border border-white/10" />

                    <div className="relative z-10">
                      {!isMoneyPower ? (
                        <>
                          <h3 className={`text-[clamp(2.4rem,4.6vw,4.2rem)] font-black leading-[1] ${accentStyles[block.accent].title}`}>
                            {block.title}
                          </h3>
                        </>
                      ) : null}
                      <p className={`mt-3 text-xl leading-relaxed text-zinc-100/88 sm:text-2xl ${isMoneyPower ? 'rounded-xl border border-cyan-300/25 bg-[linear-gradient(115deg,rgba(34,211,238,0.12),rgba(167,139,250,0.12),rgba(0,0,0,0.35))] p-3 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : ''}`}>{block.summary}</p>

                      <div className={`mt-6 ${
                        isPrimary
                          ? 'space-y-3'
                          : isBreakFree
                            ? 'space-y-4'
                            : 'grid gap-4 md:grid-cols-[1.15fr_1fr] md:items-stretch'
                      }`}>
                        <p className={`border border-cyan-300/42 bg-[linear-gradient(145deg,rgba(6,182,212,0.16),rgba(0,0,0,0.58))] p-5 text-lg leading-relaxed text-zinc-100/90 shadow-[0_0_0_1px_rgba(34,211,238,0.3),0_0_24px_rgba(34,211,238,0.16)] [clip-path:polygon(14px_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,0_100%,0_14px)] sm:text-xl ${isMoneyPower ? 'min-h-[170px]' : ''}`}>
                          {block.paragraphs[0]}
                        </p>
                        <p className={`border border-violet-300/42 bg-[linear-gradient(145deg,rgba(168,85,247,0.18),rgba(0,0,0,0.58))] p-5 text-lg leading-relaxed text-zinc-100/90 shadow-[0_0_0_1px_rgba(167,139,250,0.28),0_0_24px_rgba(167,139,250,0.16)] ${
                          isBreakFree
                            ? '[clip-path:polygon(18px_0,100%_0,100%_100%,0_100%,0_18px)] border-amber-300/42 bg-[linear-gradient(140deg,rgba(245,158,11,0.18),rgba(0,0,0,0.58))] shadow-[0_0_0_1px_rgba(245,158,11,0.28),0_0_24px_rgba(245,158,11,0.16)]'
                            : '[clip-path:polygon(0_0,calc(100%-14px)_0,100%_14px,100%_100%,14px_100%,0_calc(100%-14px))]'
                        } sm:text-xl ${isMoneyPower ? 'min-h-[170px]' : ''}`}>
                          {block.paragraphs[1]}
                        </p>
                        {isBreakFree ? (
                          <div className="rounded-xl border border-cyan-300/35 bg-[linear-gradient(115deg,rgba(34,211,238,0.12),rgba(167,139,250,0.12),rgba(0,0,0,0.45))] p-4 text-center text-base font-semibold uppercase tracking-[0.14em] text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.14)]">
                            Master yourself. Master the system.
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-6">
                        <Link href="/login" className="cta-nav-button text-sm font-semibold">
                          Enter This Track
                        </Link>
                      </div>
                    </div>
                  </article>

                  {isPrimary ? (
                    <div className="mx-auto mt-3 w-full max-w-[150px] justify-self-center self-center sm:max-w-[185px] md:mx-0 md:mt-0 md:max-w-[220px] md:justify-self-end">
                      <Image
                        src="/assets/Gold-Key.png"
                        alt="Gold key symbol"
                        width={560}
                        height={760}
                        className="h-[210px] w-full object-contain object-center animate-bounce [animation-duration:4.5s] [animation-timing-function:ease-in-out] sm:h-[260px] md:h-[360px]"
                      />
                    </div>
                  ) : null}
                </div>
                )
              )
            })}
          </div>
        </div>
      </section>

      <GlobalBottomSections />
    </div>
  )
}

