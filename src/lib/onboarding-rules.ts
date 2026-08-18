/**
 * Validation bounds for the onboarding "about you" step, shared between the
 * server action and the form. Kept out of the actions file because a server
 * actions module may only export async functions.
 */

export const PREFERRED_NAME_MAX_LENGTH = 60
export const PREFERRED_NAME_MIN_LENGTH = 1

/** Number of skin-tone swatches on the step 2 scale, lightest to darkest.
 *  Matches the melanin-01…melanin-11 images in public/images/onboarding/step2. */
export const SKIN_TONE_SCALE_COUNT = 11
export const SKIN_TONE_SCALE_MIN = 1
export const SKIN_TONE_SCALE_MAX = SKIN_TONE_SCALE_COUNT

/** True when `value` is a usable point on the skin-tone scale. Shared so the
 *  form and the action agree on what counts as a valid answer. */
export function isValidSkinToneScale(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= SKIN_TONE_SCALE_MIN &&
    value <= SKIN_TONE_SCALE_MAX
  )
}

/** Number of points on the step 3 sun-response scale (Fitzpatrick-style):
 *  1 = always burns … 6 = never burns. */
export const SUN_RESPONSE_SCALE_COUNT = 6
export const SUN_RESPONSE_MIN = 1
export const SUN_RESPONSE_MAX = SUN_RESPONSE_SCALE_COUNT

/** True when `value` is a usable point on the sun-response scale. Shared so
 *  the form and the action agree on what counts as a valid answer. */
export function isValidSunResponse(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= SUN_RESPONSE_MIN &&
    value <= SUN_RESPONSE_MAX
  )
}

const MIN_AGE_YEARS = 13
const MAX_AGE_YEARS = 120

/** Oldest / youngest birth years accepted, inclusive. Shared with the client
 *  so the Year dropdown can never offer a value the action would reject. */
export function birthYearBounds(now: Date = new Date()) {
  const currentYear = now.getFullYear()
  return { min: currentYear - MAX_AGE_YEARS, max: currentYear - MIN_AGE_YEARS }
}
