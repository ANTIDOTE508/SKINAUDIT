// Static geo data for the step 20 location map (templates/stepLocation).
// Both files live in /public and are fetched lazily, only when step 20 mounts:
//   land.json  — ~14,900 land dots on a 1° grid: [lon, lat, country index]
//   cities.txt — ~32,000 cities (population 10k+, GeoNames), most populous first:
//                name|countryCode|US state|lat|lon|country index|10·log10(population)

export type LandDot = [lon: number, lat: number, country: number]

export type City = {
  name: string
  cc: string
  adm: string
  lat: number
  lon: number
  /** Country index, shared with LandDot[2] — drives the country highlight. */
  c: number
  /** 10·log10(population): 47 ≈ 50k people. */
  p: number
  key: string
}

export type GeoData = { land: LandDot[]; cities: City[] }

export const fold = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const regionCache: Record<string, string> = {}
let displayNames: Intl.DisplayNames | null | undefined
export function countryName(cc: string): string {
  if (!cc) return ''
  if (regionCache[cc]) return regionCache[cc]
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    } catch {
      displayNames = null
    }
  }
  let name = cc
  try {
    name = displayNames?.of(cc) || cc
  } catch {
    // Unknown region code — fall back to the raw code.
  }
  return (regionCache[cc] = name)
}

/** "NY · United States" for US cities, "France" elsewhere. */
export const placeLine = (c: City) => (c.adm ? `${c.adm} · ` : '') + countryName(c.cc)

let pending: Promise<GeoData> | null = null
export function loadGeoData(): Promise<GeoData> {
  if (!pending) {
    pending = Promise.all([
      fetch('/onboarding/location/land.json').then((r) => {
        if (!r.ok) throw new Error('land.json')
        return r.json() as Promise<LandDot[]>
      }),
      fetch('/onboarding/location/cities.txt').then((r) => {
        if (!r.ok) throw new Error('cities.txt')
        return r.text()
      }),
    ])
      .then(([land, raw]) => ({
        land,
        cities: raw.split(';').map((row) => {
          const [name, cc, adm, lat, lon, c, p] = row.split('|')
          return { name, cc, adm, lat: +lat, lon: +lon, c: +c, p: +p, key: fold(name) }
        }),
      }))
      .catch((err) => {
        // Let a later mount retry instead of caching the failure forever.
        pending = null
        throw err
      })
  }
  return pending
}

/** Flat-map distance in degrees, longitude scaled by latitude, wrapping at the date line. */
export function dist(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const dl = ((((a.lon - b.lon) % 360) + 540) % 360 - 180) * Math.cos(((a.lat + b.lat) / 2) * (Math.PI / 180))
  return Math.hypot(dl, a.lat - b.lat)
}

/**
 * Snap a coordinate to a city: the nearest sizeable city (50k+) if one is
 * within 1.5°, otherwise the nearest city of any size.
 */
export function snapToCity(cities: City[], g: { lon: number; lat: number }): City {
  let big: City | null = null
  let any: City = cities[0]
  let dBig = Infinity
  let dAny = Infinity
  for (const c of cities) {
    const d = dist(c, g)
    if (d < dAny) {
      dAny = d
      any = c
    }
    if (c.p >= 47 && d < dBig) {
      dBig = d
      big = c
    }
  }
  return big && dBig < 1.5 ? big : any
}

/**
 * "par" → Paris first (biggest match); "paris, tx" or "springfield il"
 * narrows by country code, country name or US state. Max 6 results, ordered:
 * name starts with the text, then a word inside the name starts with it,
 * then contains it; ties broken by population (the list is pre-sorted).
 */
export function searchCities(cities: City[], raw: string): City[] {
  const t = fold(raw.trim())
  if (!t) return []
  const [cityQ, whereQ] = t.includes(',') ? t.split(',').map((x) => x.trim()) : [t, '']

  const tryMatch = (cq: string, wq: string) => {
    const inWhere = (c: City) =>
      !wq ||
      c.cc.toLowerCase() === wq ||
      c.adm.toLowerCase() === wq ||
      fold(countryName(c.cc)).startsWith(wq)
    const out: City[][] = [[], [], []]
    for (const c of cities) {
      if (out[0].length >= 6) break
      const i = c.key.indexOf(cq)
      if (i < 0 || !inWhere(c)) continue
      out[i === 0 ? 0 : c.key[i - 1] === ' ' || c.key[i - 1] === '-' ? 1 : 2].push(c)
    }
    return [...out[0], ...out[1], ...out[2]].slice(0, 6)
  }

  let r = tryMatch(cityQ, whereQ)
  if (!r.length && !whereQ && cityQ.includes(' ')) {
    const k = cityQ.lastIndexOf(' ')
    r = tryMatch(cityQ.slice(0, k), cityQ.slice(k + 1))
  }
  return r
}

/** Find a saved city (name + ISO country code) back in the dataset. */
export function findCity(cities: City[], name: string, cc: string): City | null {
  if (!name) return null
  const key = fold(name)
  return (
    cities.find((c) => c.key === key && (!cc || c.cc === cc)) ??
    cities.find((c) => c.key.startsWith(key) && (!cc || c.cc === cc)) ??
    null
  )
}

/**
 * Best-effort starting city from the browser's time zone ("Europe/Paris" →
 * Paris). No permission prompt, no network — only a guess the user can
 * change; returns null when the zone name isn't a city we know.
 */
export function guessCityFromTimeZone(cities: City[]): City | null {
  let tz = ''
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? ''
  } catch {
    return null
  }
  const last = tz.split('/').pop()
  if (!last || !tz.includes('/')) return null
  const key = fold(last.replace(/_/g, ' '))
  return cities.find((c) => c.key === key) ?? cities.find((c) => c.key.startsWith(key + ' ')) ?? null
}

/**
 * Like findCity, but falls back to country-state-city (the previous city
 * search) for saved towns too small for the map's dataset, so a resumed
 * user still gets their pin.
 */
export async function resolveSavedCity(data: GeoData, name: string, cc: string): Promise<City | null> {
  const hit = findCity(data.cities, name, cc)
  if (hit || !name || !cc) return hit
  try {
    const { City: CscCity } = await import('country-state-city')
    const key = fold(name)
    const m = CscCity.getCitiesOfCountry(cc)?.find((c) => fold(c.name) === key)
    if (!m?.latitude || !m.longitude) return null
    const lat = Number(m.latitude)
    const lon = Number(m.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null
    const country = data.cities.find((c) => c.cc === cc)?.c ?? -1
    return { name: m.name, cc, adm: '', lat, lon, c: country, p: 0, key }
  } catch {
    return null
  }
}
