'use client'

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="0.9" />
        <path d="M5.5 16.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      </svg>
    ),
    title: 'System-Level\nIntelligence',
    body: 'We analyze how your products work together as a complete system.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11" cy="11" r="1.4" fill="currentColor" />
        <ellipse cx="11" cy="11" rx="7" ry="2.8" stroke="currentColor" strokeWidth="0.8" />
        <ellipse cx="11" cy="11" rx="7" ry="2.8" stroke="currentColor" strokeWidth="0.8" transform="rotate(60 11 11)" />
        <ellipse cx="11" cy="11" rx="7" ry="2.8" stroke="currentColor" strokeWidth="0.8" transform="rotate(120 11 11)" />
      </svg>
    ),
    title: 'Context Matters',
    body: 'Environment, treatments, and lifestyle all influence how your skin behaves.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11" cy="11" r="3.2" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="11" cy="11" r="0.9" fill="currentColor" />
        <path d="M11 2.5v3M11 16.5v3M19.5 11h-3M5.5 11h-3" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>
    ),
    title: 'Continuous\nEvolution',
    body: 'Track changes, observe patterns, and refine your regimen over time.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="10" stroke="currentColor" strokeWidth="0.8" />
        <path d="M6.5 11.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
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
      <div ref={taglineRef} className="opacity-0 px-6 md:px-16 py-3 border-t border-white/10">
        <span className="text-[9px] tracking-[0.35em] text-alabaster-400/60 uppercase">
          BUILT FOR UNDERSTANDING
        </span>
      </div>

      {/* Feature strip */}
      <div ref={featuresRef} className="opacity-0 border-t border-white/10 bg-obsidian-950">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              className="px-8 py-5 border-r border-white/10 last:border-r-0 border-b lg:border-b-0 border-b-white/10"
            >
              <div className="text-sienna-400/70 mb-4">{feat.icon}</div>
              <h3
                className="text-[14px] font-light text-sienna-300 mb-2 whitespace-pre-line leading-[1.3]"
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
