'use client'

import { useState, useRef, useEffect, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { signIn } from '@/lib/auth-client'

type FieldErrors = {
  email?: string
  password?: string
  form?: string
}

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [backHovered, setBackHovered] = useState(false)

  const dotsRef = useRef<HTMLSpanElement>(null)
  const dotsTimeline = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const dots = dotsRef.current
    if (!dots) return
    if (isLoading) {
      const dotEls = dots.querySelectorAll('.dot')
      dotsTimeline.current = gsap.timeline({ repeat: -1 })
      dotsTimeline.current.fromTo(
        dotEls,
        { opacity: 0.2 },
        { opacity: 1, duration: 0.4, stagger: 0.15, ease: 'power2.inOut', yoyo: true, repeat: 1 }
      )
    } else {
      dotsTimeline.current?.kill()
    }
    return () => {
      dotsTimeline.current?.kill()
    }
  }, [isLoading])

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!email.trim()) next.email = 'Your email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = 'Invalid email format.'
    if (!password) next.password = 'Your password is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    setErrors({})

    try {
      const result = await signIn.email({ email, password })

      if (result.error) {
        setErrors({ form: 'Incorrect email or password.' })
        return
      }

      router.push('/studio')
    } catch {
      setErrors({ form: 'An error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.75rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: backHovered
            ? 'var(--color-alabaster-100)'
            : 'var(--color-alabaster-500)',
          textDecoration: 'none',
          transition: 'color 200ms ease',
        }}
        onMouseEnter={() => setBackHovered(true)}
        onMouseLeave={() => setBackHovered(false)}
        onFocus={() => setBackHovered(true)}
        onBlur={() => setBackHovered(false)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transform: backHovered ? 'translateX(-3px)' : 'translateX(0)',
            transition: 'transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to home
      </Link>

      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 400,
          fontSize: '2rem',
          lineHeight: 1.15,
          color: 'var(--color-alabaster-50)',
          marginBottom: '0.4rem',
        }}
      >
        Welcome back
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.875rem',
          lineHeight: 1.5,
          color: 'var(--color-alabaster-400)',
          marginBottom: '2rem',
        }}
      >
        Sign in to continue your SkinAudit
      </p>

      {errors.form && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '0.8125rem',
            color: 'var(--color-blush-500)',
            marginBottom: '1.25rem',
          }}
        >
          {errors.form}
        </motion.p>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1">
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            disabled={isLoading}
            aria-describedby={errors.email ? 'email-error' : undefined}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '4px',
              padding: '0.85rem 1rem',
              color: 'var(--color-alabaster-100)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              fontWeight: 300,
              outline: 'none',
              transition: 'border-color 200ms ease',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
          />
          {errors.email && (
            <motion.span
              id="email-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-blush-500)',
              }}
            >
              {errors.email}
            </motion.span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading}
              aria-describedby={errors.password ? 'password-error' : undefined}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: '4px',
                padding: '0.85rem 3rem 0.85rem 1rem',
                color: 'var(--color-alabaster-100)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                fontWeight: 300,
                outline: 'none',
                transition: 'border-color 200ms ease',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)')}
            />
            {/* Eye icon */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.45)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <motion.span
              id="password-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.8125rem',
                color: 'var(--color-blush-500)',
              }}
            >
              {errors.password}
            </motion.span>
          )}
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between" style={{ marginTop: '0.25rem' }}>
          <label
            className="flex items-center gap-2 cursor-pointer"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 300,
              color: 'var(--color-alabaster-400)',
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '2px',
                accentColor: 'var(--color-sienna-500)',
                cursor: 'pointer',
              }}
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8125rem',
              fontWeight: 300,
              color: 'var(--color-alabaster-400)',
              textDecoration: 'none',
              transition: 'color 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-alabaster-100)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-alabaster-400)')}
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            marginTop: '0.5rem',
            minHeight: '50px',
            background: 'var(--color-sienna-300)',
            border: 'none',
            borderRadius: '4px',
            color: 'var(--color-obsidian-950)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            transition: 'opacity 200ms ease, background 200ms ease',
          }}
          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.opacity = '1' }}
        >
          {isLoading ? (
            <span ref={dotsRef} className="flex items-center justify-center gap-1" aria-hidden="true">
              <span className="dot" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              <span className="dot" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              <span className="dot" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              <span className="sr-only">Signing in…</span>
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p
        className="text-center mt-6"
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.8125rem',
          color: 'var(--color-alabaster-500)',
        }}
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          style={{
            color: 'var(--color-alabaster-100)',
            fontWeight: 400,
            textDecoration: 'none',
          }}
        >
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
