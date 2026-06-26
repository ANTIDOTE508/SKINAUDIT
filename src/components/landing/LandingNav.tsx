'use client'

import { useState } from 'react'
import Link from 'next/link'
import SkinauditLogo from '@/components/ui/SkinauditLogo'

const NAV_ITEMS = ['PHILOSOPHY', 'HOW IT WORKS', 'FEATURES', 'ABOUT'] as const

export default function LandingNav({ navRef }: { navRef: React.RefObject<HTMLElement | null> }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav ref={navRef} className="opacity-0 relative z-30 shrink-0">
      <div className="flex items-center justify-between px-6 md:px-16 py-5">
        <SkinauditLogo />

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-9">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <a
                href="#"
                className="text-[12px] tracking-[0.15em] text-alabaster-400 hover:text-alabaster-100 transition-colors duration-300 uppercase"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-5">
          <Link
            href="/signin"
            className="text-[10px] tracking-[0.18em] text-alabaster-400 hover:text-alabaster-100 transition-colors duration-300 uppercase"
          >
            SIGN IN
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center gap-[5px] w-6 h-6"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span
              className="block w-5 h-px bg-alabaster-300 transition-all duration-300 origin-center"
              style={{ transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }}
            />
            <span
              className="block w-5 h-px bg-alabaster-300 transition-all duration-300"
              style={{ opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-5 h-px bg-alabaster-300 transition-all duration-300 origin-center"
              style={{ transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <div
        className="md:hidden overflow-hidden transition-all duration-500"
        style={{ maxHeight: menuOpen ? '300px' : '0px' }}
      >
        <ul
          className="flex flex-col border-t border-white/10"
          style={{ background: 'rgba(10,9,8,0.97)' }}
        >
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <a
                href="#"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-4 text-[13px] tracking-[0.2em] text-alabaster-400 hover:text-alabaster-100 uppercase transition-colors duration-200 border-b border-white/5"
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
