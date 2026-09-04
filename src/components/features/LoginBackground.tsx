'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

/**
 * Fond du panneau gauche de /signin.
 * Poster WebP (~80 Ko) = LCP instantané. La vidéo (~820 Ko) se charge
 * en arrière-plan après l'hydratation et apparaît en fondu une fois prête.
 * Desktop only (le panneau parent est hidden lg:block) + respect de
 * prefers-reduced-motion (poster fixe, vidéo jamais téléchargée).
 */
export default function LoginBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReducedMotion) return

    const reveal = () => setVideoReady(true)

    if (video.readyState >= 3) {
      reveal()
    } else {
      video.addEventListener('canplay', reveal, { once: true })
    }

    // Démarre le chargement réel de la vidéo maintenant (après le premier
    // paint), pour ne pas concurrencer les ressources critiques.
    video.preload = 'auto'
    video.load()
    video.play().catch(() => {
      /* autoplay bloqué : le poster reste, aucune régression visuelle */
    })

    return () => video.removeEventListener('canplay', reveal)
  }, [])

  return (
    <div className="absolute inset-0">
      {/* Poster — LCP, visible immédiatement */}
      <Image
        src="/videos/login-bg-poster.webp"
        alt=""
        aria-hidden
        fill
        priority
        sizes="55vw"
        style={{ objectFit: 'cover', objectPosition: 'center center' }}
      />

      {/* Vidéo — fondu par-dessus le poster quand prête */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="none"
        poster="/videos/login-bg-poster.webp"
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectPosition: 'center center',
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 900ms ease',
        }}
      >
        <source src="/videos/login-bg.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
