'use client'

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'
import { Camera, Search } from 'lucide-react'
import {
  BarcodeDetector as PonyfillDetector,
  prepareZXingModule,
  purgeZXingModule,
} from 'barcode-detector/ponyfill'
import { ScreenHeader } from './ScreenHeader'
import { lookupProductByBarcode } from '@/app/actions/dossier'
import type { DossierProductSummary } from './types'

type Props = {
  onBack: () => void
  onFound: (product: DossierProductSummary) => void
  onSearchInstead: () => void
}

// camera      — live viewfinder, decoding frames
// no-camera   — permission denied, no camera, or insecure context: photo only
// looking-up  — a code was read, resolving it against the catalogue / OBF
// not-found   — code read but no skincare product matches it
// photo-miss  — the picked photo holds no readable barcode
// error       — the barcode reader failed to load or the lookup failed
type Phase = 'camera' | 'no-camera' | 'looking-up' | 'not-found' | 'photo-miss' | 'error'

// Retail barcodes printed on cosmetics packaging.
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const
const SCAN_INTERVAL_MS = 200

type Detector = Pick<PonyfillDetector, 'detect'>

/**
 * Uses the browser's own BarcodeDetector when it reads retail formats
 * (Chrome Android); otherwise the ZXing WebAssembly ponyfill (Safari iOS,
 * Firefox, desktop). Its ~1 MB .wasm is only downloaded when Scan is opened.
 *
 * The ponyfill is imported statically: a failed dynamic import() chunk is
 * never retried by the bundler, which would break every later attempt.
 */
async function createDetector(): Promise<Detector> {
  const Native = (globalThis as { BarcodeDetector?: typeof PonyfillDetector }).BarcodeDetector
  if (Native) {
    try {
      const supported = await Native.getSupportedFormats()
      if (FORMATS.every((f) => supported.includes(f))) return new Native({ formats: [...FORMATS] })
    } catch {
      // Fall through to the ponyfill.
    }
  }
  // Load the .wasm now so a failure surfaces here — otherwise every frame's
  // detect() would reject and the viewfinder would fail silently. ZXing
  // caches the failed load, so it is purged to let the next attempt retry.
  try {
    await prepareZXingModule({ fireImmediately: true })
  } catch (err) {
    purgeZXingModule()
    throw err
  }
  return new PonyfillDetector({ formats: [...FORMATS] })
}

const OUTLINED: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.625rem',
  width: '100%',
  minHeight: '52px',
  borderRadius: 'var(--radius-card)',
  border: '1px solid var(--color-accent-border)',
  backgroundColor: 'transparent',
  color: 'var(--color-alabaster-200)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.9375rem',
  cursor: 'pointer',
}

const MESSAGE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.875rem',
  lineHeight: 1.6,
  color: 'var(--color-alabaster-300)',
  textAlign: 'center',
  margin: '1.25rem 0 1.5rem',
}

export function ScreenScan({ onBack, onFound, onSearchInstead }: Props) {
  const [phase, setPhase] = useState<Phase>('camera')
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  // Bumped by "Scan again" to restart the camera effect.
  const [attempt, setAttempt] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const detectorRef = useRef<Promise<Detector> | null>(null)
  // Guards against a late camera/lookup callback firing after unmount.
  const mountedRef = useRef(true)

  const getDetector = () => {
    // A failed load (e.g. offline) is not cached, so the next attempt retries.
    detectorRef.current ??= createDetector().catch((err: unknown) => {
      detectorRef.current = null
      throw err
    })
    return detectorRef.current
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const resolveCode = async (code: string) => {
    setScannedCode(code)
    setPhase('looking-up')
    try {
      const result = await lookupProductByBarcode(code)
      if (!mountedRef.current) return
      if (result.status === 'found') onFound(result.product)
      else setPhase('not-found')
    } catch {
      // Session expired or server failure — not the same as an unknown product.
      if (mountedRef.current) setPhase('error')
    }
  }

  // Live viewfinder: open the rear camera and decode a frame every
  // SCAN_INTERVAL_MS until one barcode reads.
  useEffect(() => {
    if (phase !== 'camera') return
    const video = videoRef.current
    if (!video) return

    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let stopped = false

    const stop = () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((track) => track.stop())
      video.srcObject = null
    }

    const tick = async (detector: Detector) => {
      if (stopped) return
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const [hit] = await detector.detect(video)
          if (hit && !stopped) {
            stop()
            void resolveCode(hit.rawValue)
            return
          }
        } catch {
          // A frame that fails to decode is not an error — try the next one.
        }
      }
      if (!stopped) timer = setTimeout(() => void tick(detector), SCAN_INTERVAL_MS)
    }

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        // No camera API — typically plain http on a phone, where browsers
        // only expose the camera to secure origins.
        setPhase('no-camera')
        return
      }
      let detector: Detector
      try {
        detector = await getDetector()
      } catch {
        if (!stopped) setPhase('error')
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        })
        if (stopped) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        video.srcObject = stream
        await video.play()
        void tick(detector)
      } catch {
        if (!stopped) setPhase('no-camera')
      }
    }

    void start()
    return stop
    // resolveCode/getDetector only touch refs and stable setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attempt])

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so picking the same photo twice still fires onChange.
    event.target.value = ''
    if (!file) return
    setPhase('looking-up')
    let detector: Detector
    try {
      detector = await getDetector()
    } catch {
      if (mountedRef.current) setPhase('error')
      return
    }
    let hit: { rawValue: string } | undefined
    try {
      const bitmap = await createImageBitmap(file)
      try {
        ;[hit] = await detector.detect(bitmap)
      } finally {
        bitmap.close()
      }
    } catch {
      // Unreadable or unsupported image — same outcome as no barcode found.
    }
    if (!mountedRef.current) return
    if (hit) await resolveCode(hit.rawValue)
    else setPhase('photo-miss')
  }

  const scanAgain = () => {
    setScannedCode(null)
    setPhase('camera')
    setAttempt((n) => n + 1)
  }

  const statusText: Record<Phase, string> = {
    camera: 'Centre the barcode inside the frame.',
    'no-camera':
      'The camera is unavailable. Allow camera access in your browser settings, or take a photo of the barcode instead.',
    'looking-up': 'Looking up your product…',
    'not-found': `We couldn't find this product${scannedCode ? ` (${scannedCode})` : ''}. Try searching by brand or name.`,
    'photo-miss':
      "We couldn't read a barcode in this photo. Try again closer, with the barcode flat and well lit.",
    error: 'Something went wrong. Check your connection and try again.',
  }

  return (
    <>
      <ScreenHeader title="Scan a barcode" onBack={onBack} />

      <div className="db-content">
        {phase === 'camera' && (
          <div className="db-scan-viewfinder">
            <video ref={videoRef} className="db-scan-video" playsInline muted aria-hidden="true" />
            <div className="db-scan-reticle" aria-hidden="true">
              <span className="db-scan-line" />
            </div>
          </div>
        )}

        <p role="status" aria-live="polite" style={MESSAGE}>
          {statusText[phase]}
        </p>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          className="db-sr"
          tabIndex={-1}
          aria-hidden="true"
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {phase !== 'camera' && phase !== 'looking-up' && (
            <button
              type="button"
              onClick={scanAgain}
              className="btn-primary btn-primary-accent"
              style={{ width: '100%', minHeight: '52px' }}
            >
              {phase === 'no-camera' ? 'Try the camera again' : 'Scan again'}
            </button>
          )}
          {phase !== 'looking-up' && (
            <button type="button" onClick={() => photoInputRef.current?.click()} style={OUTLINED}>
              <Camera size={18} strokeWidth={1.5} aria-hidden="true" />
              {phase === 'camera' ? 'Take a photo instead' : 'Take a photo of the barcode'}
            </button>
          )}
          {phase !== 'looking-up' && (
            <button type="button" onClick={onSearchInstead} style={OUTLINED}>
              <Search size={18} strokeWidth={1.5} aria-hidden="true" />
              Search by name instead
            </button>
          )}
        </div>
      </div>
    </>
  )
}
