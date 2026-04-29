import Image from 'next/image'
import Link from 'next/link'
import { NavApp } from '@/components/NavApp'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SiteFooter from '@/components/SiteFooter'
import NeonTypingBadge from '@/components/NeonTypingBadge'
import { syndicateOtpLoginHref } from '@/lib/syndicate-otp-paths'

const MEMBERSHIP_PREVIEW = [
  { name: 'The Pawn', note: 'Entry-level access and foundational momentum systems.' },
  { name: 'The King', note: 'Elite leadership tier with highest-level leverage principles.' },
]

const KINGS_EMPERORS_PARAGRAPHS = [
  'True leaders are not born - they are forged in the crucible of wisdom passed down through the ages. The great figures of history, from monarchs to revolutionaries, have left behind more than mere stories - they have endowed us with a roadmap to greatness. To study their lives is not just to learn tactics and strategy, but to uncover the soul of money and power itself.',
  'The Syndicate philosophy acknowledges this ancient truth while redefining it for a modern age. Success is not measured by wealth and power alone; these are mere tools, double-edged in nature. They demand mastery, balanced with moral resilience - otherwise, they enslave their wielders with corruption and indulgence. The Syndicate programs will equip you with the skills to dominate money and power networks while fortifying your integrity.',
  'To achieve greatness is to transcend selfish ambition and become a powerhouse of mastery. The Syndicate teaches that true success lies not in accumulation, but in transformation. Its members move with intent, leveraging their influence for societal impact rather than personal gain.',
]

const FEATURED_LOGOS = [
  {
    src: '/assets/press-forbes.png',
    alt: 'Forbes logo',
    href: 'https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/',
  },
  {
    src: '/assets/press-luxury.png',
    alt: 'LLM logo',
    href: 'https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/',
  },
  {
    src: '/assets/press-gq.png',
    alt: 'GQ logo',
    href: 'https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/',
  },
]

const CYBER_BORDER_STYLES = [
  'from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]',
  'from-fuchsia-400 via-pink-500 to-violet-500 shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_22px_rgba(232,121,249,0.86),0_0_56px_rgba(232,121,249,0.72),0_0_108px_rgba(232,121,249,0.56),inset_0_0_20px_rgba(232,121,249,0.27)]',
  'from-emerald-400 via-cyan-400 to-blue-500 shadow-[0_0_0_1px_rgba(16,185,129,0.9),0_0_22px_rgba(16,185,129,0.86),0_0_56px_rgba(16,185,129,0.72),0_0_108px_rgba(16,185,129,0.56),inset_0_0_20px_rgba(16,185,129,0.27)]',
  'from-amber-300 via-orange-400 to-rose-500 shadow-[0_0_0_1px_rgba(251,191,36,0.9),0_0_22px_rgba(251,191,36,0.86),0_0_56px_rgba(251,191,36,0.72),0_0_108px_rgba(251,191,36,0.56),inset_0_0_20px_rgba(251,191,36,0.27)]',
  'from-violet-400 via-indigo-500 to-cyan-400 shadow-[0_0_0_1px_rgba(129,140,248,0.9),0_0_22px_rgba(129,140,248,0.86),0_0_56px_rgba(129,140,248,0.72),0_0_108px_rgba(129,140,248,0.56),inset_0_0_20px_rgba(129,140,248,0.27)]',
  'from-lime-300 via-emerald-400 to-cyan-400 shadow-[0_0_0_1px_rgba(132,204,22,0.9),0_0_22px_rgba(132,204,22,0.86),0_0_56px_rgba(132,204,22,0.72),0_0_108px_rgba(132,204,22,0.56),inset_0_0_20px_rgba(132,204,22,0.27)]',
]

const CYBER_PANEL_GLOW = [
  'border-cyan-300/95 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_22px_rgba(56,236,255,0.86),0_0_56px_rgba(56,236,255,0.72),0_0_108px_rgba(56,236,255,0.56),inset_0_0_20px_rgba(56,236,255,0.27)]',
  'border-violet-300/95 shadow-[0_0_0_1px_rgba(193,120,255,0.9),0_0_22px_rgba(193,120,255,0.86),0_0_56px_rgba(193,120,255,0.72),0_0_108px_rgba(193,120,255,0.56),inset_0_0_20px_rgba(193,120,255,0.27)]',
  'border-rose-400/95 shadow-[0_0_0_1px_rgba(251,113,133,0.9),0_0_22px_rgba(251,113,133,0.86),0_0_56px_rgba(251,113,133,0.72),0_0_108px_rgba(251,113,133,0.56),inset_0_0_20px_rgba(251,113,133,0.27)]',
  'border-cyan-300/95 shadow-[0_0_0_1px_rgba(56,236,255,0.9),0_0_22px_rgba(56,236,255,0.86),0_0_56px_rgba(56,236,255,0.72),0_0_108px_rgba(56,236,255,0.56),inset_0_0_20px_rgba(56,236,255,0.27)]',
  'border-fuchsia-300/95 shadow-[0_0_0_1px_rgba(244,114,182,0.9),0_0_22px_rgba(244,114,182,0.86),0_0_56px_rgba(244,114,182,0.72),0_0_108px_rgba(244,114,182,0.56),inset_0_0_20px_rgba(244,114,182,0.27)]',
  'border-teal-300/95 shadow-[0_0_0_1px_rgba(94,234,212,0.9),0_0_22px_rgba(94,234,212,0.86),0_0_56px_rgba(94,234,212,0.72),0_0_108px_rgba(94,234,212,0.56),inset_0_0_20px_rgba(94,234,212,0.27)]',
]

export default function WhatYouGetPage() {
  const loginHref = syndicateOtpLoginHref()

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-black">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <iframe
          src="https://player.vimeo.com/video/899461161?autoplay=1&muted=1&loop=1&background=1"
          className="absolute left-1/2 top-1/2 h-[100svh] min-h-[56.25vw] w-[177.78svh] min-w-[100vw] -translate-x-1/2 -translate-y-1/2 scale-[1.08] opacity-56 saturate-[0.88]"
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title="What you get background video"
        />
      </div>
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/58" />
      <NavApp />
      <section className="relative z-10 flex min-h-[100svh] w-full items-center overflow-hidden px-4 pb-6 pt-[116px] max-lg:items-start sm:px-6 sm:pb-12 sm:pt-[130px]">
        <div className="pointer-events-none absolute left-1/2 top-[clamp(96px,11vw,136px)] z-20 w-full max-sm:top-[92px] -translate-x-1/2 px-4">
          <div className="mx-auto flex w-full max-w-[920px] justify-center">
            <NeonTypingBadge
              phrases={['HONOUR · MONEY · POWER · FREEDOM']}
              typingSpeed={34}
              deletingSpeed={24}
              pauseMs={420}
              boxed={false}
              className="mx-auto w-full max-w-[min(92vw,720px)]"
            />
          </div>
        </div>
        <div className="relative z-10 mx-auto grid h-full w-full max-w-[min(2200px,100vw)] items-center gap-8 max-lg:content-start lg:grid-cols-[1.2fr_0.8fr]">
          <div className="pl-[clamp(0rem,2.8vw,3.4rem)] text-left max-lg:pt-6">
            <h1
              className="mt-4 text-4xl font-bold leading-[1.04] text-[#f0d060] sm:text-5xl md:text-6xl lg:text-[7.6rem]"
              style={{ textShadow: '0 0 10px rgba(240,208,96,0.6), 0 0 24px rgba(212,175,55,0.45), 0 0 42px rgba(156,124,28,0.3)' }}
            >
              <span className="block">Access To A</span>
              <span className="block">Powerful Network</span>
              <span className="block">And Alliance.</span>
            </h1>
            <p className="mt-5 max-w-4xl text-sm text-amber-100/88 sm:text-base md:text-xl lg:text-2xl">
              <span className="block">You unlock a complete execution ecosystem:</span>
              <span className="block">strategy, implementation systems, and structured</span>
              <span className="block">growth frameworks designed for real-world outcomes.</span>
            </p>
          </div>
          <div className="relative mx-auto mt-10 grid h-[40svh] min-h-[230px] w-full max-w-[290px] translate-y-0 place-items-center sm:mt-12 sm:h-[50svh] sm:min-h-[320px] sm:max-w-[370px] lg:mt-0 lg:h-[66vh] lg:min-h-[460px] lg:max-w-[500px] lg:translate-y-[40%]">
            <div
              className="relative grid h-full w-full place-items-center"
              style={{ animation: 'whatYouGetKeyFloat 4.6s ease-in-out infinite' }}
            >
              <Image
                src="/assets/Gold-Key.png"
                alt="Gold key access marker"
                fill={false}
                width={360}
                height={620}
                sizes="(max-width: 1024px) 280px, 360px"
                className="mt-0 h-[74%] w-auto object-contain object-center drop-shadow-[0_0_62px_rgba(251,191,36,0.78)]"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 flex min-h-[90vh] items-center overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-14">
        <div className="relative z-10 mx-auto w-full max-w-[min(1860px,90vw)]">
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative mx-auto h-[72vh] min-h-[560px] w-full max-w-[880px]">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.36)_0%,rgba(251,191,36,0.12)_42%,rgba(0,0,0,0)_74%)] blur-[12px]" />
              <div className="cyber-chip-animate absolute left-[16%] top-[26%] h-[35%] w-[28%] min-h-[150px] min-w-[130px]">
                <Image
                  src="/assets/pawn2.png"
                  alt="Pawn grouped left"
                  fill
                  sizes="(max-width: 768px) 24vw, 18vw"
                  className="object-contain drop-shadow-[0_0_34px_rgba(251,191,36,0.45)]"
                />
              </div>
              <div className="cyber-chip-animate absolute left-1/2 top-[52%] h-[78%] w-[48%] min-h-[340px] min-w-[260px] -translate-x-1/2 -translate-y-1/2">
                <Image
                  src="/assets/pawn1.png"
                  alt="Pawn grouped center"
                  fill
                  sizes="(max-width: 768px) 46vw, 36vw"
                  className="object-contain drop-shadow-[0_0_62px_rgba(251,191,36,0.66)]"
                />
              </div>
              <div className="cyber-chip-animate absolute right-[16%] top-[27%] h-[38%] w-[30%] min-h-[168px] min-w-[145px]">
                <Image
                  src="/assets/pawn.png"
                  alt="Pawn grouped right"
                  fill
                  sizes="(max-width: 768px) 26vw, 20vw"
                  className="object-contain drop-shadow-[0_0_40px_rgba(251,191,36,0.5)]"
                />
              </div>
            </div>
            <article className="relative overflow-hidden bg-transparent p-6 sm:p-10">
              <h3 className="text-5xl font-black uppercase leading-[1.06] tracking-[0.04em] text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.9)] sm:text-7xl">
                Money and Power Mastery
              </h3>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-zinc-100/90 sm:text-2xl">
                <p className="text-justify">
                  The Syndicate philosophy teaches that money and power go hand in hand. They are like two sides of the same coin. Money and power, if not correctly wielded, has the potential to completely corrupt you, leading you down a dark path of corrupt, degenerate and hedonistic behaviour.
                </p>
                <p className="text-justify">
                  The Syndicate&apos;s mission goes beyond attaining money, power and influence. Its elite training programmes aim to redefine how individuals perceive power and influence, emphasising the importance of moral strength and societal impact. Members are taught to master money and power systems without succumbing to their enslavement or morally corrupting properties.
                </p>
                <p className="text-justify">
                  This is the definition of true success and greatness. This is the true meaning of money, power and life mastery.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 flex min-h-[90vh] items-center overflow-hidden px-4 py-12 sm:px-6 sm:py-14">
        <div className="relative z-10 mx-auto w-full max-w-[min(1860px,90vw)]">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="relative overflow-hidden bg-transparent p-6 sm:p-10">
              <h2 className="text-5xl font-black uppercase leading-[1.06] tracking-[0.04em] text-[#d4af37] drop-shadow-[0_0_8px_rgba(212,175,55,0.9)] sm:text-7xl">
                Follow The Path of Kings and Emperors
              </h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-zinc-100/90 sm:text-2xl">
                {KINGS_EMPERORS_PARAGRAPHS.map((paragraph) => (
                  <p key={paragraph} className="text-justify">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
            <div className="relative mx-auto mt-16 h-[320px] w-[320px] sm:mt-20 sm:h-[440px] sm:w-[440px] lg:mt-86 lg:h-[560px] lg:w-[560px]">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.28)_0%,rgba(251,191,36,0.1)_45%,rgba(0,0,0,0)_74%)] blur-[16px]" />
              <div className="relative h-full w-full" style={{ animation: 'whatYouGetCoinSpin 15s linear infinite' }}>
                <Image
                  src="/assets/coin-gold.png"
                  alt="Path of kings coin"
                  fill
                  sizes="(max-width: 1024px) 440px, 560px"
                  className="object-contain drop-shadow-[0_0_56px_rgba(251,191,36,0.72)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden px-4 py-12 sm:px-6 sm:py-14">
        <div className="relative z-10 mx-auto w-full max-w-[min(1860px,99vw)]">
          <div className="relative bg-transparent p-4 sm:p-8">
            <article className="relative overflow-hidden bg-transparent p-4 sm:p-6">
            <h2
              className="mt-3 text-6xl font-bold text-[#f0d060] sm:text-7xl lg:text-8xl"
              style={{ textShadow: '0 0 12px rgba(240, 208, 96, 0.45), 0 0 24px rgba(156, 124, 28, 0.35)' }}
            >
              The path to success is not meant to be walked alone
            </h2>
            <div className="mt-6 space-y-5 text-2xl leading-relaxed text-zinc-200/90 sm:text-3xl">
              <p>
                Joining a powerful alliance of disciplined operators is not optional for those who want sustained power and meaningful growth.
              </p>
              <p>
                The Syndicate culture is built on integrity, standards, and strategic accountability so strengths are sharpened and weaknesses are transformed.
              </p>
            </div>
            <div className="mx-auto mt-8 grid max-w-[1280px] gap-3 sm:grid-cols-2">
              {[
                'Aligned network of ambitious operators with shared standards.',
                'Strategic accountability that keeps your execution consistent.',
                'Real-world frameworks focused on leverage, not noise.',
                'A disciplined environment built for long-term power growth.',
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-amber-300/85 bg-transparent px-4 py-3 text-xl leading-relaxed text-zinc-200/90 shadow-[0_0_0_1px_rgba(251,191,36,0.72),0_0_14px_rgba(251,191,36,0.42),0_0_28px_rgba(251,191,36,0.24),inset_0_0_10px_rgba(251,191,36,0.16)] animate-[cyberChipGlow_2.5s_ease-in-out_infinite] sm:text-2xl"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="relative mx-auto mt-12 w-full max-w-[min(1600px,96vw)] overflow-hidden rounded-3xl bg-transparent p-5 sm:p-8">
              <h2 className="bg-gradient-to-r from-amber-100 via-amber-200 to-amber-400 bg-clip-text text-center text-3xl font-black tracking-[0.02em] text-transparent drop-shadow-[0_0_16px_rgba(251,191,36,0.34)] sm:text-5xl">
                You Leave With Clarity, Discipline, and Executable Systems
              </h2>
              <div className="relative mx-auto mt-8 grid w-full max-w-[1300px] grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                {['Clarity', 'Discipline', 'Execution', 'Leverage', 'Strategy', 'Scale'].map((keyword, index) => (
                  <div
                    key={keyword}
                    className={`cyber-chip-animate group relative bg-gradient-to-r p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:brightness-110 ${CYBER_BORDER_STYLES[index % CYBER_BORDER_STYLES.length]}`}
                    style={{ animationDelay: `${index * 0.18}s` }}
                  >
                    <span className="pointer-events-none absolute inset-[-1px] rounded-[10px] bg-inherit opacity-75 blur-[10px] transition duration-300 group-hover:opacity-100" />
                    <span className="relative inline-flex min-h-[58px] w-full items-center justify-center bg-[#05070c]/92 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-zinc-100 drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 group-hover:bg-[#070b14]/96 sm:min-h-[66px] sm:text-base">
                      {keyword}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="mx-auto mt-20 max-w-[26ch] text-center text-4xl font-black uppercase leading-[1.08] tracking-[0.05em] text-amber-100 sm:mt-24 sm:text-6xl md:text-7xl">
              <span className="block">IF YOU WANT TO</span>
              <span className="mt-1.5 block">
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">BE POWERFUL</span>
                <span className="mx-2 inline-block">JOIN</span>
                <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_32px_rgba(251,191,36,0.92)]">THE SYNDICATE</span>
              </span>
            </h2>
            <div className="mt-12 flex flex-wrap justify-center gap-x-7 gap-y-4 sm:mt-14">
              <div className="cyber-chip-animate group relative bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
                <Link
                  href={loginHref}
                  prefetch
                  className="hamburger-attract relative inline-flex min-h-[58px] min-w-[240px] items-center justify-center bg-[#05070c]/92 px-10 py-4 text-lg font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.04] hover:bg-[#070b14]/95"
                >
                  JOIN NOW
                </Link>
              </div>
              <div className="cyber-chip-animate group relative bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 p-[1px] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]">
                <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[10px]" />
                <Link
                  href="/programs"
                  prefetch
                  className="hamburger-attract relative inline-flex min-h-[58px] min-w-[240px] items-center justify-center bg-[#05070c]/92 px-10 py-4 text-lg font-bold tracking-[0.08em] text-zinc-100 [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)] transition duration-300 hover:scale-[1.04] hover:bg-[#070b14]/95"
                >
                  EXPLORE PROGRAMS
                </Link>
              </div>
            </div>
            </article>
          </div>
        </div>
      </section>

      <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={40} />
      <SiteFooter />

    </div>
  )
}

