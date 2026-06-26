export default function LandingFooter() {
  return (
    <div className="shrink-0 px-6 md:px-16 py-3 border-t border-white/10 flex items-center justify-between">
      <span className="text-[9px] tracking-[0.2em] text-alabaster-400/50 uppercase">
        © 2024 SKINAUDIT
      </span>

      <ul className="flex items-center gap-7">
        {['PRIVACY', 'TERMS', 'CONTACT'].map((item) => (
          <li key={item}>
            <a
              href="#"
              className="text-[9px] tracking-[0.18em] text-alabaster-400/50 hover:text-alabaster-200 uppercase transition-colors duration-300"
            >
              {item}
            </a>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4 text-alabaster-400/50">
        <a href="#" aria-label="Instagram" className="hover:text-alabaster-200 transition-colors duration-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
          </svg>
        </a>
        <a href="#" aria-label="Email" className="hover:text-alabaster-200 transition-colors duration-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M2 7l10 7 10-7" />
          </svg>
        </a>
      </div>
    </div>
  )
}
