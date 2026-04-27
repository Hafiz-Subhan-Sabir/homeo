'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Check, Crown, Shield, Star, Swords } from 'lucide-react'
import Image from 'next/image'

type PlanKey = 'bundle' | 'pawn' | 'knight' | 'king'
type BillingKey = 'monthly' | 'yearly'

interface PricingTier {
  price: Record<BillingKey, string>
  oldPrice?: Record<BillingKey, string>
  badge: string
  title: string
  description: string
  features: string[]
  accent: 'gold'
  icon: ReactNode
  cta: string
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const pricingData: Record<PlanKey, PricingTier> = {
  bundle: {
    price: { monthly: '£499', yearly: '£4,999' },
    oldPrice: { monthly: '£699', yearly: '£6,999' },
    badge: 'ALL PROGRAMS BUNDLE',
    title: 'All Programs Bundle',
    description:
      'Complete access to every current and upcoming program. Built for serious operators who want total coverage.',
    features: [
      'Access to all active programs',
      'All future program updates included',
      'Premium downloadable resources',
      'Priority content releases',
      'Completion certificates',
    ],
    accent: 'gold',
    icon: <Shield className="h-4 w-4" />,
    cta: 'Get Full Bundle',
  },
  pawn: {
    price: { monthly: '£19.19', yearly: '£191.90' },
    oldPrice: { monthly: '£29.99', yearly: '£299.90' },
    badge: 'THE PAWN',
    title: 'The Pawn',
    description:
      'Enter the world of The Syndicate. Ideal for newcomers building momentum with structured direction.',
    features: [
      'Core foundation vault access',
      'New member roadmap',
      'Weekly action prompts',
      'Private community entry',
      'Monthly mission briefing',
      'Starter accountability framework',
    ],
    accent: 'gold',
    icon: <Star className="h-4 w-4" />,
    cta: 'Join The Pawn',
  },
  knight: {
    price: { monthly: '£33.33', yearly: '£333.30' },
    oldPrice: { monthly: '£49.99', yearly: '£499.90' },
    badge: 'THE KNIGHT',
    title: 'The Knight',
    description:
      'Expand your knowledge base with our more indepth offering focused on strategic execution and systems.',
    features: [
      'Everything in The Pawn',
      'Advanced strategy modules',
      'Deep-dive weekly workshops',
      'Execution playbooks and SOPs',
      'Faster support response lane',
      'Early access to selected releases',
    ],
    accent: 'gold',
    icon: <Swords className="h-4 w-4" />,
    cta: 'Join The Knight',
  },
  king: {
    price: { monthly: '£77.77', yearly: '£777.70' },
    oldPrice: { monthly: '£99.99', yearly: '£999.90' },
    badge: 'THE KING',
    title: 'The King',
    description:
      'Master your mind, money and power with highest-level resources, insider material, and elite support priority.',
    features: [
      'Everything in The Knight',
      'Elite inner-circle content',
      'Monthly insider workshop access',
      'Direct support lane',
      'Private leadership channel',
      'Highest-priority release access',
    ],
    accent: 'gold',
    icon: <Crown className="h-4 w-4" />,
    cta: 'Join The King',
  },
}

function AccentGlow({ accent: _accent }: { accent: PricingTier['accent'] }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br blur-2xl opacity-70',
        'from-amber-300/30 via-amber-500/8 to-transparent',
      )}
    />
  )
}

function TierCard({
  planKey,
  tier,
  billing,
  highlighted,
}: {
  planKey: PlanKey
  tier: PricingTier
  billing: BillingKey
  highlighted?: boolean
}) {
  const accentBorder = 'border-amber-300/35 hover:border-amber-300/75'
  const accentText = 'text-amber-300'
  const accentShadow =
    'shadow-[0_0_0_1px_rgba(251,191,36,0.36),0_0_5px_rgba(251,191,36,0.42),0_0_30px_rgba(251,191,36,0.16)] hover:shadow-[0_0_0_1px_rgba(251,191,36,0.5),0_0_5px_rgba(251,191,36,0.62),0_0_90px_rgba(251,191,36,0.34)] hover:brightness-110'

  return (
    <div
      className={cn(
        'relative h-full overflow-hidden rounded-3xl border bg-[var(--glass-bg)] backdrop-blur-xl transition-all duration-300 will-change-transform hover:scale-[1.03]',
        accentBorder,
        accentShadow,
        highlighted && 'ring-1 ring-white/10',
      )}
    >
      <AccentGlow accent={tier.accent} />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 2px, transparent 6px)',
        }}
      />

      <div className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div
            className={cn(
              'inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[0.8rem] font-bold tracking-[0.16em] sm:text-[0.86rem]',
              accentText,
            )}
          >
            {tier.icon}
            <span>{tier.badge}</span>
          </div>

          {planKey === 'bundle' && (
            <div className="inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-[0.78rem] font-semibold text-white/80 sm:text-[0.82rem]">
              <Star className="h-3.5 w-3.5 text-amber-300" />
              Recommended
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between gap-4">
          <motion.div
            key={`${planKey}-${billing}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center gap-3">
              {tier.oldPrice?.[billing] && (
                <div
                  className="text-lg font-semibold text-white/40 line-through sm:text-xl"
                  style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
                >
                  {tier.oldPrice[billing]}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div
                className="text-4xl font-black text-white sm:text-5xl"
                style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              >
                {tier.price[billing]}
              </div>
              <div className="text-sm text-white/60">
                /{billing === 'monthly' ? 'mo' : 'yr'}
              </div>
            </div>

            <div className="mt-2 max-w-[42ch] text-sm text-white/70 font-body">
              {tier.description}
            </div>
          </motion.div>

        </div>

        <div className="mt-5 grid grid-cols-1 gap-2">
          {tier.features.map((f) => (
            <div
              key={f}
              className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5"
            >
              <Check className={cn('mt-0.5 h-4 w-4 shrink-0', accentText)} />
              <span className="text-[13px] leading-snug text-white/80">{f}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={cn(
            'hamburger-attract mt-5 w-full rounded-2xl border border-amber-300/70 bg-black/75 px-5 py-2.5 text-sm font-semibold tracking-wide text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] hover:bg-black/90 hover:shadow-[0_0_24px_rgba(251,191,36,0.5)] active:scale-[0.99]',
            planKey === 'bundle' && 'border-amber-200/75 text-amber-50',
          )}
        >
          {tier.cta}
        </button>
      </div>
    </div>
  )
}

export function PricingPage({
  className,
  onSelectPlan,
}: {
  className?: string
  onSelectPlan?: (plan: PlanKey) => void
}) {
  const [billing, setBilling] = useState<BillingKey>('monthly')

  const tiers = useMemo(
    () => [
      { key: 'bundle' as const, tier: pricingData.bundle },
      { key: 'pawn' as const, tier: pricingData.pawn },
      { key: 'knight' as const, tier: pricingData.knight },
      { key: 'king' as const, tier: pricingData.king },
    ],
    [],
  )

  return (
    <section
      id="pricing"
      className={cn(
        'relative w-full min-h-screen overflow-hidden bg-background px-[clamp(0.75rem,2.2vw,2rem)] py-20 md:py-24',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <Image src="/Assets/g.gif" alt="" aria-hidden fill sizes="100vw" className="object-cover opacity-30" unoptimized />
        <div className="absolute inset-0 bg-black/55" />
      </div>
      <div className="relative mx-auto flex w-[min(92vw,1900px)] flex-col items-center">
        <header className="mb-12 rounded-2xl border border-amber-300/45 bg-black/20 px-6 py-10 text-center shadow-[0_0_0_1px_rgba(251,191,36,0.35),0_0_5px_rgba(251,191,36,0.45),0_0_30px_rgba(251,191,36,0.14)] md:mb-16 md:px-10 md:py-12">
          <h2 className="mt-2 font-display text-4xl font-black uppercase tracking-[0.12em] text-white md:text-5xl">
            Syndicate Offers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-base tracking-[0.1em] text-zinc-400 md:text-lg">
            Choose your access tier: full bundle coverage or The Pawn, The Knight, and The King membership paths.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 rounded-xl border border-amber-300/40 bg-black/30 px-6 py-4 text-sm font-mono tracking-[0.2em] uppercase shadow-[0_0_0_1px_rgba(251,191,36,0.25),0_0_5px_rgba(251,191,36,0.35)]">
            <span className={billing === 'monthly' ? 'text-amber-300' : 'text-zinc-500'}>
              Monthly
            </span>
            <button
              type="button"
              onClick={() => setBilling((b) => (b === 'monthly' ? 'yearly' : 'monthly'))}
              className={cn(
                'relative h-7 w-14 rounded-full border border-amber-300/25 bg-black/40 p-1 transition-all duration-200',
                billing === 'yearly' && 'border-amber-300/45 bg-amber-300/12',
              )}
              aria-label="Toggle billing period"
            >
              <span
                className={cn(
                  'block h-5 w-5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.5)] transition-all duration-200',
                  billing === 'yearly' ? 'translate-x-7' : 'translate-x-0',
                )}
              />
            </button>
            <span className={billing === 'yearly' ? 'text-amber-300' : 'text-zinc-500'}>
              Yearly
            </span>
          </div>
        </header>

        <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 md:gap-6 xl:gap-5">
          {tiers.map(({ key, tier }) => (
            <div key={key} onClick={() => onSelectPlan?.(key)} className="cursor-default">
              <TierCard
                planKey={key}
                tier={tier}
                billing={billing}
                highlighted={key === 'bundle'}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
