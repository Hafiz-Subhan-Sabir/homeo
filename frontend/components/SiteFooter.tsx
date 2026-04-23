import Image from 'next/image'
import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer
      className="relative overflow-hidden border-t bg-[#02050b] px-4 py-10 sm:px-6 sm:py-12"
      style={{
        borderColor: 'rgba(251, 191, 36, 0.6)',
        boxShadow: 'inset 0 1px 0 rgba(251, 191, 36, 0.28), 0 -8px 30px rgba(251, 191, 36, 0.12)',
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <video autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover opacity-60">
          <source src="/Assets/v.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/62" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col gap-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(260px,1.15fr)_minmax(320px,1fr)] md:items-start md:gap-10">
          <div className="p-1 sm:p-2">
            <Image
              src="/Assets/logo.png"
              alt="Onem logo"
              width={360}
              height={120}
              className="hamburger-attract h-20 w-auto object-contain sm:h-24"
              priority={false}
            />
          </div>

          <div className="rounded-xl p-4 sm:p-5">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.22em] sm:text-xs"
              style={{ color: 'rgba(253, 230, 138, 0.95)', textShadow: '0 0 10px rgba(251, 191, 36, 0.35)' }}
            >
              Quick Links
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold sm:text-base">
              <Link href="/" className="transition-all hover:brightness-110" style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Home</Link>
              <Link href="/what-you-get" className="transition-all hover:brightness-110" style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>What You Get</Link>
              <Link href="/our-methods" className="transition-all hover:brightness-110" style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Our Methods</Link>
              <Link href="/programs" className="transition-all hover:brightness-110" style={{ color: 'rgba(254, 243, 199, 0.95)', textShadow: '0 0 8px rgba(251, 191, 36, 0.25)' }}>Programs</Link>
            </div>
          </div>
        </div>

        <p
          className="border-t pt-5 text-center text-[10px] tracking-[0.13em] sm:text-xs"
          style={{ borderColor: 'rgba(251, 191, 36, 0.45)', color: 'rgba(254, 243, 199, 0.85)', textShadow: '0 0 8px rgba(251, 191, 36, 0.2)' }}
        >
          All content is made for educational purposes and is up to the individual to apply the knowledge. We do not guarantee any results.
        </p>
      </div>
    </footer>
  )
}
