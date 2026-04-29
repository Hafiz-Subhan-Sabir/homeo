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
  billingMode?: 'lifetime' | 'recurring'
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const pricingData: Record<PlanKey, PricingTier> = {
  bundle: {
    price: { monthly: '£333', yearly: '£3,330' },
    oldPrice: { monthly: '£555', yearly: '£5,550' },
    badge: 'ALL PROGRAMS BUNDLE',
    title: 'All Programs Bundle',
    description:
      'You will access everything with full lifetime coverage across the complete Syndicate ecosystem.',
    features: [
      'You will access everything',
      'All programs lifetime',
      'Syndicate Challenges Mode',
      'Exclusive Membership Section',
      'Complete Access of Dashboard',
      'Quick Access to all social apps',
      'Goals & Milestone section',
    ],
    accent: 'gold',
    icon: <Shield className="h-4 w-4" />,
    cta: 'Get Full Bundle',
    billingMode: 'lifetime',
  },
  pawn: {
    price: { monthly: '£19.19', yearly: '£191.90' },
    oldPrice: { monthly: '£29.99', yearly: '£299.90' },
    badge: 'THE PAWN · BASIC',
    title: 'The Pawn Basic',
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
    cta: 'Join The Pawn Basic',
    billingMode: 'recurring',
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
    billingMode: 'recurring',
  },
  king: {
    price: { monthly: '£77.77', yearly: '£777.70' },
    oldPrice: { monthly: '£99.99', yearly: '£999.90' },
    badge: 'THE KING · PREMIUM',
    title: 'The King Premium',
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
    cta: 'Join The King Premium',
    billingMode: 'recurring',
  },
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
  const isLifetime = tier.billingMode === 'lifetime'
  const activeBilling: BillingKey = isLifetime ? 'monthly' : billing
  const isBundle = planKey === 'bundle'
  const accentText = 'text-amber-300'
  const hudThemeByPlan: Record<
    PlanKey,
    {
      cardFrame: string
      cardGlow: string
      lightningColor: string
      lightningSoft: string
      frame: string
      glow: string
      chip: string
    }
  > = {
    bundle: {
      cardFrame: 'border-cyan-300 border-[10px]',
      cardGlow:
        'shadow-[0_0_0_1px_rgba(34,211,238,0.9),0_0_22px_rgba(34,211,238,0.86),0_0_56px_rgba(34,211,238,0.72),0_0_108px_rgba(34,211,238,0.56),inset_0_0_20px_rgba(34,211,238,0.27)]',
      lightningColor: 'rgba(34,211,238,0.96)',
      lightningSoft: 'rgba(34,211,238,0.62)',
      frame: 'border-cyan-300/95 hover:border-cyan-200/100',
      glow: 'shadow-[0_0_0_1px_rgba(56,236,255,0.85),0_0_42px_rgba(56,236,255,0.55),0_0_110px_rgba(56,236,255,0.24)]',
      chip: 'border-cyan-50 bg-cyan-200/75 shadow-[0_0_18px_rgba(56,236,255,1)] text-cyan-100',
    },
    pawn: {
      cardFrame: 'border-lime-300 border-[10px]',
      cardGlow:
        'shadow-[0_0_0_1px_rgba(163,230,53,0.9),0_0_22px_rgba(163,230,53,0.86),0_0_56px_rgba(163,230,53,0.72),0_0_108px_rgba(163,230,53,0.56),inset_0_0_20px_rgba(163,230,53,0.27)]',
      lightningColor: 'rgba(163,230,53,0.96)',
      lightningSoft: 'rgba(163,230,53,0.62)',
      frame: 'border-lime-300/95 hover:border-lime-200/100',
      glow: 'shadow-[0_0_0_1px_rgba(120,255,90,0.85),0_0_42px_rgba(120,255,90,0.55),0_0_110px_rgba(120,255,90,0.24)]',
      chip: 'border-lime-50 bg-lime-200/75 shadow-[0_0_18px_rgba(120,255,90,1)] text-lime-100',
    },
    knight: {
      cardFrame: 'border-fuchsia-400 border-[10px]',
      cardGlow:
        'shadow-[0_0_0_1px_rgba(232,121,249,0.9),0_0_22px_rgba(232,121,249,0.86),0_0_56px_rgba(232,121,249,0.72),0_0_108px_rgba(232,121,249,0.56),inset_0_0_20px_rgba(232,121,249,0.27)]',
      lightningColor: 'rgba(232,121,249,0.96)',
      lightningSoft: 'rgba(232,121,249,0.62)',
      frame: 'border-violet-300/95 hover:border-violet-200/100',
      glow: 'shadow-[0_0_0_1px_rgba(193,120,255,0.85),0_0_42px_rgba(193,120,255,0.55),0_0_110px_rgba(193,120,255,0.24)]',
      chip: 'border-violet-50 bg-violet-200/75 shadow-[0_0_18px_rgba(193,120,255,1)] text-violet-100',
    },
    king: {
      cardFrame: 'border-amber-300 border-[10px]',
      cardGlow:
        'shadow-[0_0_0_1px_rgba(252,211,77,0.9),0_0_22px_rgba(252,211,77,0.86),0_0_56px_rgba(252,211,77,0.72),0_0_108px_rgba(252,211,77,0.56),inset_0_0_20px_rgba(252,211,77,0.27)]',
      lightningColor: 'rgba(252,211,77,0.96)',
      lightningSoft: 'rgba(252,211,77,0.62)',
      frame: 'border-amber-300/95 hover:border-amber-200/100',
      glow: 'shadow-[0_0_0_1px_rgba(255,198,64,0.85),0_0_42px_rgba(255,198,64,0.55),0_0_110px_rgba(255,198,64,0.24)]',
      chip: 'border-amber-50 bg-amber-200/75 shadow-[0_0_18px_rgba(255,198,64,1)] text-amber-100',
    },
  }
  const accentBorder = hudThemeByPlan[planKey].cardFrame
  const gradientShellByPlan: Record<PlanKey, string> = {
    bundle: 'from-transparent via-transparent to-transparent',
    pawn: 'from-transparent via-transparent to-transparent',
    knight: 'from-transparent via-transparent to-transparent',
    king: 'from-transparent via-transparent to-transparent',
  }
  const accentShadow = hudThemeByPlan[planKey].cardGlow

  return (
    <div
      className={cn(
        'lightning-glow-card relative rounded-3xl bg-gradient-to-r p-[2px] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]',
        gradientShellByPlan[planKey],
        accentShadow,
      )}
      style={{
        ['--lightning-color' as any]: hudThemeByPlan[planKey].lightningColor,
        ['--lightning-color-soft' as any]: hudThemeByPlan[planKey].lightningSoft,
      }}
    >
      <span className="pointer-events-none absolute inset-[-1px] bg-inherit opacity-70 blur-[12px]" />
      <div
        className={cn(
          'relative h-full overflow-hidden rounded-3xl border transition-all duration-300 will-change-transform hover:scale-[1.02] [clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]',
          'bg-transparent',
          accentBorder,
          highlighted && 'ring-1 ring-white/10',
        )}
      >
        <span className="pointer-events-none absolute inset-x-5 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-95" />

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
              {tier.oldPrice?.[activeBilling] && (
                <div
                  className="text-lg font-semibold text-white/40 line-through sm:text-xl"
                  style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
                >
                  {tier.oldPrice[activeBilling]}
                </div>
              )}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div
                className="text-4xl font-black text-white sm:text-5xl"
                style={{ fontFamily: 'Inter, Segoe UI, Roboto, Arial, sans-serif' }}
              >
                {tier.price[activeBilling]}
              </div>
              <div className="text-sm text-white/60">
                /{isLifetime ? 'lifetime' : billing === 'monthly' ? 'mo' : 'yr'}
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
              className={cn(
                'flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5',
                'border-white/15 bg-transparent',
              )}
            >
              <Check className={cn('mt-0.5 h-4 w-4 shrink-0', accentText)} />
              <span className="text-[13px] leading-snug text-white/80">{f}</span>
            </div>
          ))}
        </div>

          <button
            type="button"
            className={cn(
              'hamburger-attract mt-5 w-full rounded-2xl border border-white/35 px-5 py-2.5 text-sm font-semibold tracking-wide text-zinc-100 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_0_34px_rgba(236,72,153,0.24)] active:scale-[0.99]',
              'bg-transparent',
              hudThemeByPlan[planKey].frame,
              hudThemeByPlan[planKey].glow,
            )}
          >
            {tier.cta}
          </button>
        </div>
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
        <Image src="/assets/g.gif" alt="" aria-hidden fill sizes="100vw" className="object-cover opacity-18" unoptimized />
        <div className="absolute inset-0 bg-black/70" />
      </div>
      <div className="relative mx-auto flex w-full max-w-none flex-col items-center">
        <header className="mb-12 px-6 py-8 text-center md:mb-16 md:px-10 md:py-10">
          <h2 className="mt-2 font-display text-5xl font-black uppercase tracking-[0.14em] text-white md:text-6xl">
            Syndicate Offers
          </h2>
          <p className="mx-auto mt-4 max-w-3xl font-mono text-lg tracking-[0.1em] text-zinc-300 md:text-xl">
            Choose your access tier: full bundle lifetime coverage or The Pawn and The King membership paths.
          </p>

          <div className="mt-8 inline-flex items-center justify-center gap-4 rounded-xl bg-black/10 px-6 py-4 text-sm font-mono tracking-[0.2em] uppercase shadow-[0_0_18px_rgba(251,191,36,0.2)]">
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

        <div className="grid w-full grid-cols-1 gap-5 px-[2vw] md:grid-cols-2 md:gap-6 xl:grid-cols-3 xl:gap-6">
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
