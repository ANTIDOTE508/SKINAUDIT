'use client'

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <path d="M7 7l8 8M15 7l-8 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
    ),
    title: 'System-Level\nIntelligence',
    body: 'We analyze how your products work together as a complete system.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11" cy="11" r="5" stroke="currentColor" strokeWidth="0.8" />
        <path d="M6 11h10M11 6v10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M7.5 7.5l7 7M14.5 7.5l-7 7" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" />
      </svg>
    ),
    title: 'Context Matters',
    body: 'Environment, treatments, and lifestyle all influence how your skin behaves.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="0.8" />
        <path d="M11 1v4M11 17v4M1 11h4M17 11h4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Continuous\nEvolution',
    body: 'Track changes, observe patterns, and refine your regimen over time.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <path d="M7.5 9.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Your Regimen,\nYour Decisions',
    body: 'Insights, not instructions. You stay in control of your choices.',
  },
] as const

interface LandingFeaturesProps {
  taglineRef: React.RefObject<HTMLDivElement | null>
  featuresRef: React.RefObject<HTMLDivElement | null>
}

export default function LandingFeatures({ taglineRef, featuresRef }: LandingFeaturesProps) {
  return (
    <>
      {/* Tagline divider */}
      <div ref={taglineRef} className="opacity-0 px-6 md:px-16 py-3 border-t border-white/10 shrink-0">
        <span className="text-[9px] tracking-[0.35em] text-alabaster-400/60 uppercase">
          BUILT FOR UNDERSTANDING
        </span>
      </div>

      {/* Feature strip */}
      <div ref={featuresRef} className="opacity-0 border-t border-white/10 bg-obsidian-950 shrink-0">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="px-8 py-5 border-r border-white/10 last:border-r-0 border-b lg:border-b-0 border-b-white/10"
            >
              <div className="text-sienna-400/80 mb-3">{feat.icon}</div>
              <h3
                className="text-[14px] font-light text-alabaster-100 mb-2 whitespace-pre-line leading-[1.3]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {feat.title}
              </h3>
              <p className="text-[11px] leading-[1.65] text-alabaster-400">{feat.body}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
