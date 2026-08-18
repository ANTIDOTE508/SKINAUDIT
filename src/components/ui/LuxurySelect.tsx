'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'

export type LuxurySelectOption = {
  value: string
  label: string
}

type Props = {
  /** Id of the visible <label> element that names this control. */
  labelId: string
  /** '' means nothing is selected — the placeholder shows instead. */
  value: string
  onChange: (value: string) => void
  options: LuxurySelectOption[]
  placeholder: string
  disabled?: boolean
  /** Max height of the open panel, in px. */
  maxPanelHeight?: number
}

const FIELD_BORDER_IDLE = 'rgba(184,134,61,0.28)'
const FIELD_BORDER_ACTIVE = 'var(--color-sienna-400)'
const PANEL_GAP = 6
const VIEWPORT_MARGIN = 16
const OPTION_HEIGHT = 40

/** Typeahead buffer resets after this idle gap, matching native select feel. */
const TYPEAHEAD_RESET_MS = 700

type PanelPosition = {
  left: number
  width: number
  /** Vertical anchor — we pin whichever edge keeps the panel on screen. */
  top?: number
  bottom?: number
  maxHeight: number
  /** Which way the panel opened, so the entrance animates from the trigger. */
  direction: 'down' | 'up'
}

/**
 * Accessible listbox styled for the SKINAUDIT dark palette.
 *
 * Native <select> is unusable here: the popup list is painted by the OS, so
 * <option> ignores our tokens and a stark system menu drops over the near-black
 * surface. This renders the list ourselves and keeps the WAI-ARIA combobox
 * (listbox popup) semantics.
 *
 * The panel is portalled to document.body with fixed positioning because the
 * onboarding step lives inside an `overflow-y: auto` <main> that would clip an
 * absolutely positioned panel. Position is recomputed on scroll and resize.
 */
export function LuxurySelect({
  labelId,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  maxPanelHeight = 320,
}: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typeaheadRef = useRef<{ buffer: string; at: number }>({ buffer: '', at: 0 })

  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const optionId = useCallback((index: number) => `${baseId}-opt-${index}`, [baseId])

  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [focused, setFocused] = useState(false)
  const [position, setPosition] = useState<PanelPosition | null>(null)

  const selectedIndex = useMemo(
    () => options.findIndex((o) => o.value === value),
    [options, value]
  )
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0)

  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : null

  useEffect(() => {
    setMounted(true)
  }, [])

  // ── Positioning ────────────────────────────────────────────────
  const measure = useCallback(() => {
    const node = triggerRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_MARGIN
    const spaceAbove = rect.top - PANEL_GAP - VIEWPORT_MARGIN
    // Prefer opening downward; flip only when the space above is meaningfully
    // better, so the field doesn't hop around on minor viewport changes.
    const openUp = spaceBelow < Math.min(maxPanelHeight, 200) && spaceAbove > spaceBelow

    setPosition({
      left: rect.left,
      width: rect.width,
      direction: openUp ? 'up' : 'down',
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + PANEL_GAP }
        : { top: rect.bottom + PANEL_GAP }),
      maxHeight: Math.max(120, Math.min(maxPanelHeight, openUp ? spaceAbove : spaceBelow)),
    })
  }, [maxPanelHeight])

  useLayoutEffect(() => {
    if (!open) return
    measure()
    const onReflow = () => measure()
    // `true` captures scrolls in any ancestor scroller, including <main>.
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [open, measure])

  // ── Entrance animation ─────────────────────────────────────────
  // Guarded by a ref rather than by `position` in the deps: repositioning on
  // scroll must not replay the animation, but the panel's first paint must
  // never be missed either.
  const hasAnimatedRef = useRef(false)
  const ctxRef = useRef<gsap.Context | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      hasAnimatedRef.current = false
      return
    }
    if (hasAnimatedRef.current || !position) return
    const node = panelRef.current
    if (!node) return
    hasAnimatedRef.current = true
    const direction = position.direction
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set(node, { opacity: 1, y: 0, scaleY: 1 })
        return
      }
      gsap.fromTo(
        node,
        { opacity: 0, y: direction === 'down' ? -8 : 8, scaleY: 0.965 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.28, ease: 'power3.out' }
      )
      const items = node.querySelectorAll('[data-option]')
      if (items.length) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 4 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out', stagger: 0.012, delay: 0.04 }
        )
      }
    }, node)
    ctxRef.current = ctx
  }, [open, position])

  // Cleanup is keyed off close/unmount alone, so a reposition mid-animation
  // never reverts the tween that is still playing.
  useEffect(() => {
    if (open) return
    ctxRef.current?.revert()
    ctxRef.current = null
  }, [open])

  useEffect(() => () => { ctxRef.current?.revert() }, [])

  // ── Keep the active option in view ─────────────────────────────
  useEffect(() => {
    if (!open) return
    const list = listRef.current
    if (!list) return
    const item = list.querySelector<HTMLElement>(`#${CSS.escape(optionId(activeIndex))}`)
    item?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, optionId])

  // ── Outside click ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  const openPanel = useCallback(
    (startIndex?: number) => {
      if (disabled || options.length === 0) return
      setActiveIndex(
        startIndex ?? (selectedIndex >= 0 ? selectedIndex : 0)
      )
      // Measure before opening so the panel mounts with a position already
      // set. Otherwise `position` is still null on the first open of this
      // instance and the entrance animation — which keys off `open` alone —
      // would bail out and never replay.
      measure()
      setOpen(true)
    },
    [disabled, options.length, selectedIndex, measure]
  )

  const closePanel = useCallback((refocus = true) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }, [])

  const commit = useCallback(
    (index: number) => {
      const option = options[index]
      if (!option) return
      onChange(option.value)
      closePanel()
    },
    [options, onChange, closePanel]
  )

  /** Typing letters/digits jumps to the first matching option, native-style. */
  const runTypeahead = useCallback(
    (char: string) => {
      const now = Date.now()
      const state = typeaheadRef.current
      state.buffer = now - state.at > TYPEAHEAD_RESET_MS ? char : state.buffer + char
      state.at = now
      const query = state.buffer.toLowerCase()

      const from = open ? activeIndex : selectedIndex >= 0 ? selectedIndex : 0
      // Repeating a single character cycles through matches instead of sticking.
      const startOffset = state.buffer.length === 1 ? 1 : 0
      for (let i = 0; i < options.length; i++) {
        const index = (from + startOffset + i) % options.length
        if (options[index].label.toLowerCase().startsWith(query)) {
          if (open) setActiveIndex(index)
          else openPanel(index)
          return
        }
      }
    },
    [open, activeIndex, selectedIndex, options, openPanel]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!open) {
      switch (e.key) {
        case 'Enter':
        case ' ':
        case 'ArrowDown':
          e.preventDefault()
          openPanel()
          return
        case 'ArrowUp':
          e.preventDefault()
          openPanel(selectedIndex >= 0 ? selectedIndex : options.length - 1)
          return
        default:
          if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
            e.preventDefault()
            runTypeahead(e.key)
          }
          return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, options.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'PageDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 8, options.length - 1))
        break
      case 'PageUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 8, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        commit(activeIndex)
        break
      case 'Escape':
        e.preventDefault()
        closePanel()
        break
      case 'Tab':
        // Let focus move on naturally; just dismiss the popup.
        setOpen(false)
        break
      default:
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
          e.preventDefault()
          runTypeahead(e.key)
        }
    }
  }

  const borderColor = open || focused ? FIELD_BORDER_ACTIVE : FIELD_BORDER_IDLE

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        aria-labelledby={labelId}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={() => (open ? closePanel() : openPanel())}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 300,
          fontSize: '0.9375rem',
          textAlign: 'left',
          lineHeight: 1.2,
          color: selectedLabel ? 'var(--color-alabaster-50)' : 'var(--color-alabaster-400)',
          backgroundColor: 'transparent',
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
          padding: '0.9375rem 1.125rem',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color var(--duration-micro) var(--ease-luxury)',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedLabel ?? placeholder}
        </span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            flexShrink: 0,
            color: 'var(--color-sienna-400)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform var(--duration-short) var(--ease-luxury)',
          }}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {mounted &&
        open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              left: position.left,
              width: position.width,
              ...(position.top !== undefined ? { top: position.top } : {}),
              ...(position.bottom !== undefined ? { bottom: position.bottom } : {}),
              zIndex: 120,
              transformOrigin: position.direction === 'down' ? 'top center' : 'bottom center',
              backgroundColor: 'rgba(18,16,14,0.94)',
              backdropFilter: 'blur(14px) saturate(1.1)',
              WebkitBackdropFilter: 'blur(14px) saturate(1.1)',
              border: '1px solid rgba(184,134,61,0.30)',
              borderRadius: 'var(--radius-badge)',
              boxShadow:
                '0 1px 0 0 rgba(232,201,154,0.06) inset, 0 24px 60px -12px rgba(0,0,0,0.75), 0 2px 10px rgba(0,0,0,0.45)',
              overflow: 'hidden',
            }}
          >
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={labelId}
              tabIndex={-1}
              className="luxury-select-list"
              style={{
                listStyle: 'none',
                margin: 0,
                padding: '0.375rem',
                maxHeight: position.maxHeight,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
              }}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <li
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    data-option
                    onPointerEnter={() => setActiveIndex(index)}
                    // pointerdown would blur the trigger before the click lands.
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => commit(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      minHeight: OPTION_HEIGHT,
                      padding: '0.5rem 0.75rem',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 300,
                      fontSize: '0.9375rem',
                      letterSpacing: '0.005em',
                      color: isSelected
                        ? 'var(--color-sienna-300)'
                        : isActive
                          ? 'var(--color-alabaster-50)'
                          : 'var(--color-alabaster-300)',
                      backgroundColor: isActive
                        ? 'rgba(184,134,61,0.12)'
                        : isSelected
                          ? 'rgba(184,134,61,0.06)'
                          : 'transparent',
                      transition:
                        'background-color var(--duration-micro) var(--ease-luxury), color var(--duration-micro) var(--ease-luxury)',
                    }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {option.label}
                    </span>
                    {isSelected && (
                      <svg
                        aria-hidden="true"
                        width="11"
                        height="9"
                        viewBox="0 0 11 9"
                        fill="none"
                        style={{ flexShrink: 0, color: 'var(--color-sienna-400)' }}
                      >
                        <path
                          d="M1 4.6L4 7.6L10 1.4"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  )
}
