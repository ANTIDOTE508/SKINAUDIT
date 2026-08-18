import type { ClimateZone, Season } from '@prisma/client'

/**
 * Pure function of today's date + hemisphere — no API call needed.
 * Northern hemisphere: Dec/Jan/Feb -> WINTER, Mar/Apr/May -> SPRING,
 * Jun/Jul/Aug -> SUMMER, Sep/Oct/Nov -> AUTUMN. Southern hemisphere is
 * offset by 6 months.
 */
export function detectSeason(latitude: number, now: Date = new Date()): Season {
  const month = now.getMonth() // 0-11
  const isSouthern = latitude < 0

  // Map each month to its northern-hemisphere season, then flip if southern.
  let season: Season
  if (month === 11 || month === 0 || month === 1) {
    season = 'WINTER'
  } else if (month >= 2 && month <= 4) {
    season = 'SPRING'
  } else if (month >= 5 && month <= 7) {
    season = 'SUMMER'
  } else {
    season = 'AUTUMN'
  }

  if (!isSouthern) return season

  const opposite: Record<Season, Season> = {
    WINTER: 'SUMMER',
    SUMMER: 'WINTER',
    SPRING: 'AUTUMN',
    AUTUMN: 'SPRING',
  }
  return opposite[season]
}

/** Minimal shape of the Open-Meteo response fields we actually consume. */
type OpenMeteoResponse = {
  current?: {
    relative_humidity_2m?: number
  }
}

/**
 * Fetches current relative humidity from Open-Meteo (free, keyless) and maps
 * it to the ClimateZone enum. Returns null on any failure (network error,
 * unexpected shape) so the caller can fall back to leaving climate unset —
 * this is a best-effort enhancement, not a blocking requirement.
 *
 * Thresholds: <40% -> DRY, 40-65% -> TEMPERATE ("Moderate (humid)" in the
 * UI), >65% -> HUMID. Simple 3-bucket split centered on the 40-65% band
 * Open-Meteo/most humidity references treat as "comfortable/moderate".
 */
export async function detectClimateZone(
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<ClimateZone | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=relative_humidity_2m&timezone=auto`
    const res = await fetch(url, { signal })
    if (!res.ok) return null

    const data = (await res.json()) as OpenMeteoResponse
    const humidity = data.current?.relative_humidity_2m
    if (typeof humidity !== 'number' || Number.isNaN(humidity)) return null

    if (humidity < 40) return 'DRY'
    if (humidity <= 65) return 'TEMPERATE'
    return 'HUMID'
  } catch {
    return null
  }
}
