'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import styles from './FAQSection.module.css'

gsap.registerPlugin(ScrollTrigger)

type FaqCategory = 'general' | 'pricing' | 'program'

const FAQ_TABS: { id: FaqCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'program', label: 'Program' },
]

const FAQS_BY_CATEGORY: Record<FaqCategory, { q: string; a: string }[]> = {
  general: [
    {
      q: 'What is The Syndicate?',
      a: 'The Syndicate is an elite organisation focused on money, power, and mastery—not conformity, but learning to operate effectively inside the capitalist system while building honour, loyalty, and strategic alliances. It offers structured Level 1 foundation courses (for example Money Mastery, Power Mastery, and Self Mastery), practical methods described on the site, and a path toward deeper training for those who qualify—not a get-rich-quick scheme, and not aimed at the faint-hearted.',
    },
    {
      q: 'How long will I have access to what I buy?',
      a: 'Level 1 courses are sold as individual products with pricing shown on the Courses page (for example Money Mastery – Level 1 is offered at a promotional price with the standard price struck through). The site states that these Level 1 courses are only available for a limited time before being taken down—so access duration and any post-purchase terms are governed by the product and legal pages at checkout. Membership tiers (The Pawn, The Knight, The King) are listed on the Subscribe page as “Coming soon”; when they launch, access will follow the Subscription Conditions and Terms linked in the footer.',
    },
    {
      q: 'How do levels, vetting, and “advanced” training work?',
      a: 'The homepage describes a “7 levels of power” framework and states that only Level 1 foundation material is available online for a limited window. People who want advanced techniques must go through a rigorous selection and vetting process; the site states that fewer than 3% of applicants are successful. That keeps the deepest material private and reserved for the most capable and honourable members.',
    },
    {
      q: 'Are new programmes or offers released often?',
      a: 'The Courses area presents Level 1 tracks in topics such as Money, Power, and Self, with filters for content type (PDF and VIDEO). The brand emphasises that Level 1 online courses are time-limited and may be removed, while the broader roadmap includes subscription tiers and ongoing positioning as a movement—not a static catalogue. For the latest enrolment windows and tiers, use the Courses and Subscribe pages on the site.',
    },
    {
      q: 'Will this work if I am in a job or at university?',
      a: 'The Syndicate positions itself for people prepared to strive—employees, founders, and serious learners alike—who want practical mastery rather than abstract theory. Training is framed as demanding and ethical at once; you progress through recorded course formats (and future membership benefits when live) on your own schedule, but the organisation expects real commitment, not casual browsing.',
    },
  ],
  pricing: [
    {
      q: 'Can I cancel a subscription when memberships go live?',
      a: 'Subscription products are shown on the Subscribe page as “Coming soon,” so billing and cancellation mechanics will be defined in the Subscription Conditions and Terms & Conditions linked in the footer once checkout is active. Typically, paid access continues until the end of the period you have already paid for; always rely on those legal documents for binding rules.',
    },
    {
      q: 'How do refunds and guarantees work?',
      a: 'The site footer links to a dedicated Refund Policy alongside Terms & Conditions, Subscription Conditions, and Privacy Policy. The homepage also notes that all content is for educational purposes and that results are not guaranteed. For any refund request or cooling-off rules, follow the Refund Policy and contact paths given there—do not rely on informal summaries.',
    },
    {
      q: 'Do I have to pay monthly to get started?',
      a: 'No. You can start with individual Level 1 courses purchased from the Courses page (for example Money Mastery – Level 1 at the advertised sale price). Monthly memberships (The Pawn, The Knight, The King) are advertised on the Subscribe page with monthly prices but marked “Coming soon,” so they are optional add-ons once launched—not a prerequisite to buying a course today.',
    },
    {
      q: 'What do the membership tiers cost on the Subscribe page?',
      a: 'As listed on the Subscribe page: The Pawn at £19.19/month, The Knight at £33.33/month, and The King at £77.77/month—all currently marked “Coming soon,” with “Register your interest” as the call to action. The homepage shows different placeholder figures in places; for subscription pricing, treat the Subscribe page as the reference for the product you are signing up for once it is live.',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'The public pages do not enumerate every processor or wallet. At checkout on the-syndicate.com, you will see the payment options supported for your region. Until checkout is live for a given product, use “Register your interest” where offered and watch the site for launch details.',
    },
  ],
  program: [
    {
      q: 'Is the content live or recorded?',
      a: 'Level 1 courses are delivered as structured learning with PDF and VIDEO formats (see the Courses page filters). Our Methods explains that lessons are designed so techniques can be implemented from the first video, combining immersive training with a practical, results-oriented tone rather than passive theory.',
    },
    {
      q: 'How often are new programmes or modules added?',
      a: 'The site stresses limited-time availability for Level 1 online courses and a selective path for advanced material. New public drops and membership perks will be announced on the homepage, Courses, What You Get, and Subscribe sections as they go live—there is no promise of a fixed weekly release cadence like a TV schedule.',
    },
    {
      q: 'What if I need help?',
      a: 'What You Get highlights access to a powerful network and alliance built on integrity and honour, alongside the educational content. Our Methods and the homepage frame the Syndicate as a serious community and philosophy, not a faceless video library. Exact support channels (tickets, community, calls) will depend on what is shipped with each product tier; check the relevant product page and legal terms at purchase.',
    },
    {
      q: 'Who is The Syndicate for?',
      a: 'The copy is aimed at a small subset of people who want money and power mastery with a moral code—aspiring entrepreneurs, professionals, and anyone willing to strive hard, reject “average,” and treat the work as transformation rather than entertainment. Advanced tracks are explicitly not for everyone and require vetting.',
    },
    {
      q: 'How do I know if The Syndicate is right for me?',
      a: 'If you want practical frameworks for wealth and influence, ancient-and-modern strategic thinking, and an alliance-based community—and you accept that outcomes depend on you, with no guaranteed results—then the positioning on the homepage and Our Methods pages describes the fit. If you want effortless passive income or guaranteed riches, the site itself says that is not what this is.',
    },
    {
      q: 'Do I need special tools or software to get started?',
      a: 'You need a device and internet access to stream or download course materials (PDF/VIDEO). No exotic proprietary hardware is advertised; any specific downloads or templates ship as part of the course product.',
    },
    {
      q: 'How much time should I commit each week?',
      a: 'The organisation emphasises discipline and struggle as the price of mastery; Our Methods says information is designed to be absorbed and applied immediately. Most members should plan for several focused hours per week to work through lessons and exercises properly, though pacing is ultimately yours.',
    },
  ],
}

export default function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const itemsRef = useRef<(HTMLDivElement | null)[]>([])
  const [category, setCategory] = useState<FaqCategory>('general')
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = FAQS_BY_CATEGORY[category]

  useEffect(() => {
    setOpenIndex(0)
  }, [category])

  useEffect(() => {
    if (!sectionRef.current) return
    const items = faqs
      .map((_, i) => itemsRef.current[i])
      .filter((el): el is HTMLDivElement => el != null)
    const title = titleRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      gsap.set([title, ...items], { opacity: 1, y: 0 })
      return
    }

    gsap.set([title, ...items], { opacity: 0, y: 20 })
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 82%',
        end: 'top 30%',
        scrub: 1,
      },
    })
    tl.to(title, { opacity: 1, y: 0, duration: 0.45, ease: 'slow(0.7,0.7)' }, 0)
    items.forEach((el, i) => {
      tl.to(el, { opacity: 1, y: 0, duration: 0.35, ease: 'slow(0.7,0.7)' }, 0.12 + i * 0.08)
    })

    return () => {
      tl.scrollTrigger?.kill()
      tl.kill()
    }
  }, [category, faqs])

  return (
    <section ref={sectionRef} id="faq" className={styles.faq}>
      <div className={styles.bgMedia} aria-hidden>
        <Image src="/Assets/tt.gif" alt="" fill sizes="100vw" className={styles.bgImage} unoptimized />
        <div className={styles.bgOverlay} />
      </div>
      <div className={styles.container}>
        <h2 ref={titleRef} className={styles.title}>
          Frequently Asked Questions
        </h2>
        <p className={styles.subtitle}>Everything you need to know before and after joining THE SYNDICATE.</p>
        <div className={styles.tabs} role="tablist" aria-label="FAQ categories">
          {FAQ_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={category === tab.id}
              className={`${styles.tab} ${category === tab.id ? styles.tabActive : ''}`}
              onClick={() => setCategory(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.list} role="tabpanel">
          {faqs.map((f, i) => (
            <div
              key={`${category}-${f.q}`}
              ref={(el) => {
                itemsRef.current[i] = el
              }}
              className={`${styles.item} ${openIndex === i ? styles.open : ''}`}
            >
              <button type="button" className={styles.question} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span className={styles.questionText}>{f.q}</span>
                <span className={styles.icon}>{openIndex === i ? '−' : '+'}</span>
              </button>
              <div className={styles.answerWrap}>
                <p className={styles.answer}>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
