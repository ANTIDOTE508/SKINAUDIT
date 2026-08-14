/**
 * Identity display helpers.
 *
 * Extracted from the dashboard SignOutButton so the Studio's mobile account
 * sheet derives initials and display names identically — one source of truth
 * for how a user is addressed across the app.
 */

/**
 * Treat empty and whitespace-only names as absent. Better Auth may hand back
 * either, and both would otherwise fall through the `if (name)` guard and
 * produce junk ("G@" from an email, or an empty string).
 */
function normalizeName(name: string | null): string | null {
  const trimmed = name?.trim()
  return trimmed ? trimmed : null
}

/** Local-part of an email, guarding against a leading "@". */
function emailLocalPart(email: string): string {
  return email.split('@')[0] || email
}

export function getInitials(name: string | null, email: string): string {
  const normalized = normalizeName(name)
  if (normalized) {
    const parts = normalized.split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  return emailLocalPart(email).slice(0, 2).toUpperCase()
}

export function getDisplayName(name: string | null, email: string): string {
  const normalized = normalizeName(name)
  if (normalized) {
    return normalized.split(/\s+/)[0]
  }
  const local = emailLocalPart(email)
  return local.length > 14 ? local.slice(0, 14) + '…' : local
}
