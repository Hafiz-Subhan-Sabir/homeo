'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import FeaturedLogosStrip from '@/components/FeaturedLogosStrip'
import SiteFooter from '@/components/SiteFooter'

const FEATURED_LOGOS = [
  {
    src: '/Assets/press-forbes.png',
    alt: 'Forbes logo',
    href: 'https://forbes.ge/en/how-the-syndicate-uses-mastery-and-empowerment-to-redefine-business/',
  },
  {
    src: '/Assets/press-luxury.png',
    alt: 'LLM logo',
    href: 'https://www.luxurylifestylemag.co.uk/money/how-the-syndicate-empowers-individuals-to-master-power-money-and-influence-in-the-money-mastery-course/',
  },
  {
    src: '/Assets/press-gq.png',
    alt: 'GQ logo',
    href: 'https://gq.co.za/wealth/2025-02-10-how-the-syndicate-can-disrupt-the-traditional-model-of-influence-and-education-in-the-digital-age/',
  },
]

export default function GlobalBottomSections() {
  const pathname = usePathname()
  const isProgramsPage = pathname === '/programs'
  const actionWord = pathname === '/what-you-get' ? 'BE POWERFUL' : pathname === '/our-methods' ? 'BE RICH' : 'MASTER MONEY'

  return (
    <>
      <section id="joinNowSection" className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20">
        <div className="pointer-events-none absolute inset-0">
          <video autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover opacity-55">
            <source src="/Assets/v.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/72" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-3 text-center">
          {isProgramsPage ? (
            <h2 className="mx-auto mt-3 max-w-[30ch] text-4xl font-black uppercase leading-[1.08] tracking-[0.05em] text-amber-100 sm:text-6xl md:text-7xl">
              <span className="block">
                IF YOU WANT
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">FREEDOM</span>
                FROM
              </span>
              <span className="mt-1.5 block">
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">9 TO 5</span>
                JOIN
                <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_32px_rgba(251,191,36,0.92)]">THE SYNDICATE</span>
              </span>
            </h2>
          ) : (
            <h2 className="mx-auto mt-3 max-w-[26ch] text-4xl font-black uppercase leading-[1.08] tracking-[0.05em] text-amber-100 sm:text-6xl md:text-7xl">
              <span className="block">IF YOU WANT TO</span>
              <span className="mt-1.5 block">
                <span className="hamburger-attract mx-2 inline-block text-amber-200 drop-shadow-[0_0_30px_rgba(251,191,36,0.9)]">{actionWord}</span>
                <span className="mx-2 inline-block">JOIN</span>
                <span className="hamburger-attract mx-2 inline-block text-amber-100 drop-shadow-[0_0_32px_rgba(251,191,36,0.92)]">THE SYNDICATE</span>
              </span>
            </h2>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-4 sm:mt-12">
            <Link
              href="/login"
              className="hamburger-attract inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-xl border border-amber-300/80 bg-black/80 px-10 py-4 text-lg font-bold tracking-[0.03em] text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:scale-[1.04] hover:bg-black/95 hover:shadow-[0_0_36px_rgba(251,191,36,0.68)]"
            >
              JOIN NOW
            </Link>
            <Link
              href="/programs"
              className="hamburger-attract inline-flex min-h-[56px] min-w-[220px] items-center justify-center rounded-xl border border-amber-300/80 bg-black/80 px-10 py-4 text-lg font-bold tracking-[0.03em] text-amber-50 shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:scale-[1.04] hover:bg-black/95 hover:shadow-[0_0_36px_rgba(251,191,36,0.68)]"
            >
              EXPLORE PROGRAMS
            </Link>
          </div>
        </div>
      </section>
      <FeaturedLogosStrip logos={FEATURED_LOGOS} speedSeconds={40} />
      <SiteFooter />
    </>
  )
}

