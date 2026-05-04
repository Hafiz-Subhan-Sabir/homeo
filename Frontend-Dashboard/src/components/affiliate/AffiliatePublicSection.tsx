'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HelpCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function AffiliatePublicSection({ className }: { className?: string }) {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <section
      id="affiliate-program"
      className={cn(
        'relative w-full border-t border-amber-300/25 bg-black/50 px-[clamp(0.75rem,2.2vw,2rem)] py-16 md:py-20',
        className,
      )}
      aria-labelledby="affiliate-program-heading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_360px_at_50%_0%,rgba(251,191,36,0.08),transparent_55%)]" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 shrink-0 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]" aria-hidden />
              <h2
                id="affiliate-program-heading"
                className="font-display text-4xl font-black uppercase tracking-[0.12em] text-white md:text-5xl"
              >
                Affiliate
              </h2>
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/50 bg-black/50 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.25)] transition hover:border-amber-200 hover:text-amber-50"
                aria-expanded={helpOpen}
                aria-controls="affiliate-how-panel"
                title="How it works"
              >
                <HelpCircle className="h-5 w-5" aria-hidden />
                <span className="sr-only">How affiliate login works</span>
              </button>
            </div>
            <p className="mt-4 max-w-3xl text-base leading-relaxed tracking-wide text-zinc-300 md:text-lg">
              Become a Syndicate affiliate: share your tracked links, earn when your audience joins and buys, and
              watch clicks, leads, and commissions in your partner dashboard. Built for operators who want leverage —
              not fluff.
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-400 md:text-base">
              After you are approved as a partner, use the same email we have on file. You will get a one-time code
              (same luxury OTP experience as member login), then your stats and referral tools unlock instantly.
            </p>
          </div>
        </div>

        {helpOpen ? (
          <motion.div
            id="affiliate-how-panel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-cyan-400/30 bg-[#070a10]/95 p-5 text-sm leading-relaxed text-zinc-200 shadow-[0_0_24px_rgba(34,211,238,0.12)] md:p-6 md:text-base"
          >
            <p className="font-semibold uppercase tracking-[0.14em] text-cyan-200/90">How to use it</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 marker:text-amber-300/90">
              <li>Click &quot;Affiliate login&quot; (here or in the site menu).</li>
              <li>Enter the email tied to your affiliate profile.</li>
              <li>Enter the 6-digit code we email you — then your dashboard opens in the browser.</li>
              <li>Copy your referral link from the dashboard and share it; returning traffic and purchases attach to you.</li>
            </ol>
            <p className="mt-3 text-zinc-400">
              This login is separate from the member area. Member access still uses Join Now / login with the main OTP flow.
            </p>
          </motion.div>
        ) : null}

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/affiliate-login"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-amber-300/70 bg-gradient-to-b from-amber-400/25 to-amber-700/10 px-8 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-50 shadow-[0_0_20px_rgba(251,191,36,0.35)] transition hover:border-amber-200 hover:shadow-[0_0_28px_rgba(251,191,36,0.5)]"
          >
            Affiliate login
          </Link>
          <Link
            href="/programs"
            className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-400 underline-offset-4 hover:text-zinc-200 hover:underline"
          >
            Explore programs
          </Link>
        </div>
      </div>
    </section>
  )
}
