'use client'

export default function LandingQuote({
  quoteRef,
}: {
  quoteRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div ref={quoteRef} className="opacity-0 px-6 md:px-16 py-16 md:py-20 text-center">
      <p
        className="text-sienna-300 leading-[1.5] mx-auto mb-5"
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 300,
          fontStyle: 'italic',
          fontSize: 'clamp(1.25rem, 2.4vw, 1.7rem)',
          maxWidth: '640px',
        }}
      >
        &ldquo;Most routines fail silently. The ingredients are fine. The sequence is not.&rdquo;
      </p>
      <span
        className="text-alabaster-400/60 uppercase"
        style={{ fontSize: '10px', letterSpacing: '0.25em' }}
      >
        — Formulation Science
      </span>
    </div>
  )
}
