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
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const dotsRef = useRef<HTMLSpanElement>(null)
  const dotsTimeline = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!dotsRef.current) return
    if (isLoading) {
      const dots = dotsRef.current.querySelectorAll('.dot')
      dotsTimeline.current = gsap.timeline({ repeat: -1 })
      dotsTimeline.current.fromTo(
        dots,
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

      router.push('/dashboard')
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
      <h2
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 400,
          fontSize: '2rem',
          lineHeight: 1.15,
          color: 'var(--color-alabaster-50)',
          marginBottom: '0.5rem',
        }}
      >
        Welcome back.
      </h2>
      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--color-alabaster-400)',
          marginBottom: '2rem',
        }}
      >
        Your skincare intelligence
        <br />
        is waiting for you.
      </p>

      <hr className="divider-subtle" style={{ marginBottom: '2rem' }} />

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

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="label-caps">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-underline"
            placeholder="you@example.com"
            disabled={isLoading}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <motion.span
              id="email-error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '0.8125rem',
                color: 'var(--color-blush-500)',
                marginTop: '0.25rem',
              }}
            >
              {errors.email}
            </motion.span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="label-caps">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-underline pr-10"
              placeholder="••••••••"
              disabled={isLoading}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 bottom-2"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                padding: 0,
                transition: 'color 200ms ease',
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
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
                fontWeight: 400,
                fontSize: '0.8125rem',
                color: 'var(--color-blush-500)',
                marginTop: '0.25rem',
              }}
            >
              {errors.password}
            </motion.span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full mt-2"
          style={{ minHeight: '52px' }}
        >
          {isLoading ? (
            <span ref={dotsRef} className="flex items-center gap-1" aria-hidden="true">
              <span className="dot" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              <span className="dot" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              <span className="dot" style={{ display: 'inline-block', width: 4, height: 4, borderRadius: '50%', backgroundColor: 'currentColor' }} />
              <span className="sr-only">Signing in…</span>
            </span>
          ) : (
            'Access my space →'
          )}
        </button>
      </form>

      <p
        className="text-center mt-6"
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.8125rem',
          color: 'var(--color-text-muted)',
        }}
      >
        No account yet?{' '}
        <Link
          href="/signup"
          className="btn-ghost"
          style={{ display: 'inline', fontSize: 'inherit' }}
        >
          Get started →
        </Link>
      </p>
    </motion.div>
  )
}
