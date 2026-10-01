// Dot-matrix world map for step 20 — a port of the canvas engine in
// templates/stepLocation/stepLocation.html (see stepLocation_spec.md for the
// figures: zoom rules, timings, opacities). Flat equirectangular projection
// that wraps left/right, drawn every frame.

import { dist, snapToCity, type City, type GeoData } from './geoData'

type Cam = { lon: number; lat: number; zoom: number }

type Options = {
  /** A tap on the map resolved to a city. `onDot` = the tap was right on a city dot. */
  onTap: (city: City, onDot: boolean) => void
  /** Font family string for the canvas labels (next/font names are generated). */
  fontFamily: string
}

const DESK = 1024
const PANEL = 480 // panel width + gutter on desktop
const WORLD: Cam = { lon: 12, lat: 12, zoom: 1 }

const near360 = (lon: number, ref: number) => lon + 360 * Math.round((ref - lon) / 360)
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export class WorldMap {
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private cam: Cam = { ...WORLD }
  private hover: City | null = null
  private pins: [City | null, City | null] = [null, null]
  private split = false
  private drop = new Map<City, number>()
  private flight = 0
  private introTimers: ReturnType<typeof setTimeout>[] = []
  private frame = 0
  private t0 = performance.now()
  private down: { id: number; x: number; y: number; cam: Cam; moved: boolean } | null = null
  private ro: ResizeObserver
  private reduced: boolean
  private destroyed = false

  constructor(
    private canvas: HTMLCanvasElement,
    private wrap: HTMLElement,
    private data: GeoData,
    private opts: Options,
  ) {
    this.ctx = canvas.getContext('2d')!
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(wrap)
    addEventListener('resize', this.resize)
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointerleave', this.onLeave)
    canvas.addEventListener('pointercancel', this.onCancel)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    this.resize()
    this.frame = requestAnimationFrame(this.draw)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.frame)
    cancelAnimationFrame(this.flight)
    this.clearIntro()
    this.ro.disconnect()
    removeEventListener('resize', this.resize)
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointerleave', this.onLeave)
    this.canvas.removeEventListener('pointercancel', this.onCancel)
    this.canvas.removeEventListener('wheel', this.onWheel)
  }

  /* ---------- geometry ---------- */

  private isDesk = () => innerWidth >= DESK
  // Visual centre of the map area not covered by the panel.
  private viewCenter = () =>
    this.isDesk() ? { x: (this.W - PANEL) / 2, y: this.H / 2 + 10 } : { x: this.W / 2, y: this.H / 2 - 10 }
  private visW = () => (this.isDesk() ? this.W - PANEL : this.W)
  // Zoom 1 = the whole world fits the visible map width.
  private baseK = () => Math.max(1e-3, this.visW() / 360)
  private maxZoom = () => 40 / this.baseK()
  private cityZoom = () => (this.isDesk() ? 14 : 7.5) / this.baseK()

  private proj(lon: number, lat: number) {
    const cam = this.cam
    lon = near360(lon, cam.lon)
    const k = this.baseK() * cam.zoom
    const c = this.viewCenter()
    return { x: c.x + (lon - cam.lon) * k, y: c.y - (lat - cam.lat) * k }
  }

  private unproj(x: number, y: number) {
    const k = this.baseK() * this.cam.zoom
    const c = this.viewCenter()
    const lon = this.cam.lon + (x - c.x) / k
    return { lon: ((((lon + 180) % 360) + 360) % 360) - 180, lat: this.cam.lat - (y - c.y) / k }
  }

  private resize = () => {
    const r = this.wrap.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    this.W = r.width
    this.H = r.height
    this.canvas.width = this.W * dpr
    this.canvas.height = this.H * dpr
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // Which city dots to draw: more of them as you zoom in.
  private shownCities() {
    const k = this.baseK() * this.cam.zoom
    return this.data.cities.slice(0, k < 6 ? 150 : k < 14 ? 600 : 2500)
  }

  /* ---------- drawing ---------- */

  private draw = (now: number) => {
    if (this.destroyed) return
    const { ctx, W, H } = this
    ctx.clearRect(0, 0, W, H)
    const k = this.baseK() * this.cam.zoom
    const r = Math.max(0.7, Math.min(3.2, k * 0.3))
    const home = this.pins[0] ? this.pins[0].c : -2
    const pins = this.pins.filter((p): p is City => !!p)

    for (const [lon, lat, cc] of this.data.land) {
      const p = this.proj(lon, lat)
      if (p.x < -4 || p.x > W + 4 || p.y < -4 || p.y > H + 4) continue
      let a = cc === home ? 0.4 : 0.13 // selected country lights up
      for (const pin of pins) {
        const d = dist({ lon, lat }, pin)
        if (d < 12) a = Math.max(a, 0.16 + 0.55 * (1 - d / 12))
      }
      ctx.fillStyle = `rgba(214,195,174,${a})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, 7)
      ctx.fill()
    }

    // Selectable cities.
    for (const c of this.shownCities()) {
      const p = this.proj(c.lon, c.lat)
      if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) continue
      const hov = this.hover === c
      ctx.fillStyle = hov ? '#efe9e1' : 'rgba(239,233,225,.55)'
      ctx.beginPath()
      ctx.arc(p.x, p.y, hov ? 3.2 : 1.8, 0, 7)
      ctx.fill()
      if (hov && !this.pins.includes(c)) this.label(p, c.name, false)
    }

    // Pins.
    const ph = this.reduced ? 0 : ((now - this.t0) % 2200) / 2200
    this.pins.forEach((pin, i) => {
      if (!pin) return
      const p = this.proj(pin.lon, pin.lat)
      const primary = i === 0
      if (primary && !this.reduced) {
        for (const o of [0, 0.5]) {
          const f = (ph + o) % 1
          ctx.strokeStyle = `rgba(214,195,174,${0.55 * (1 - f)})`
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(p.x, p.y, 6 + f * 30, 0, 7)
          ctx.stroke()
        }
      }
      // Teardrop pin.
      const drop = this.drop.get(pin) ?? 1
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.translate(0, -(1 - drop) * 40)
      ctx.globalAlpha = Math.min(1, drop * 1.5)
      ctx.fillStyle = primary ? '#d6c3ae' : '#141210'
      ctx.strokeStyle = '#d6c3ae'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(-9, -12, -10, -20, 0, -26)
      ctx.bezierCurveTo(10, -20, 9, -12, 0, 0)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = primary ? '#1a1612' : '#d6c3ae'
      ctx.beginPath()
      ctx.arc(0, -17, 3.2, 0, 7)
      ctx.fill()
      ctx.restore()
      if (drop > 0.6)
        this.label(
          { x: p.x, y: p.y - 32 },
          pin.name + (this.split ? (primary ? ' · main' : ' · second') : ''),
          true,
        )
    })

    this.frame = requestAnimationFrame(this.draw)
  }

  private label(p: { x: number; y: number }, text: string, strong: boolean) {
    const { ctx, W } = this
    ctx.font = `${strong ? 500 : 400} 12.5px ${this.opts.fontFamily}`
    const w = ctx.measureText(text).width + 16
    const x = Math.min(Math.max(p.x - w / 2, 6), W - w - 6)
    const y = p.y - 26
    ctx.fillStyle = strong ? 'rgba(20,18,16,.92)' : 'rgba(20,18,16,.8)'
    ctx.strokeStyle = 'rgba(239,233,225,.2)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(x, y, w, 22, 11)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = strong ? '#efe9e1' : '#b0a69b'
    ctx.fillText(text, x + 8, y + 15)
  }

  /* ---------- camera ---------- */

  private flyTo(lon: number, lat: number, zoom: number, ms = 1100) {
    lon = near360(lon, this.cam.lon)
    const from = { ...this.cam }
    const to = { lon, lat, zoom }
    const st = performance.now()
    if (this.reduced) ms = 0
    cancelAnimationFrame(this.flight)
    const step = (now: number) => {
      if (this.destroyed) return
      const t = ms ? Math.min(1, (now - st) / ms) : 1
      const e = ease(t)
      // Zoom out a little mid-flight for a sense of travel.
      const bump = Math.sin(Math.PI * t) * Math.min(1.2, dist(from, to) / 40)
      this.cam = {
        lon: from.lon + (to.lon - from.lon) * e,
        lat: from.lat + (to.lat - from.lat) * e,
        zoom: Math.max(1, from.zoom + (to.zoom - from.zoom) * e - bump),
      }
      if (t < 1) this.flight = requestAnimationFrame(step)
    }
    this.flight = requestAnimationFrame(step)
  }

  private dropAnim(pin: City) {
    if (this.reduced) {
      this.drop.set(pin, 1)
      return
    }
    const st = performance.now()
    this.drop.set(pin, 0)
    const s = (now: number) => {
      if (this.destroyed) return
      const t = Math.min(1, (now - st) / 520)
      this.drop.set(pin, t < 1 ? 1 - Math.pow(1 - t, 3) * Math.abs(Math.cos(t * Math.PI * 1.5)) : 1)
      if (t < 1) requestAnimationFrame(s)
    }
    requestAnimationFrame(s)
  }

  // Phone: frame the country (the part of it near the city, so Alaska doesn't
  // shrink New York), clamped so tiny countries don't zoom in absurdly.
  // Countries too small to draw fall back to a city view.
  private countryFrame(city: City): Cam {
    const dots = this.data.land.filter(
      ([lon, lat, cc]) => cc === city.c && dist({ lon: lon + 0.5, lat: lat + 0.5 }, city) < 26,
    )
    if (dots.length < 4) return { lon: city.lon, lat: city.lat, zoom: 24 / this.baseK() }
    let x0 = 1e9
    let x1 = -1e9
    let y0 = 1e9
    let y1 = -1e9
    for (const [lon, lat] of dots) {
      const l = near360(lon + 0.5, city.lon)
      x0 = Math.min(x0, l - 0.5)
      x1 = Math.max(x1, l + 0.5)
      y0 = Math.min(y0, lat)
      y1 = Math.max(y1, lat + 1)
    }
    const { W, H } = this
    const w = W - 40
    const h = H - 28 - 70 // visible map on a phone, minus sheet overlap and the pin label
    const k = 0.86 * Math.min(w / (x1 - x0), h / (y1 - y0), 17)
    let lon = (x0 + x1) / 2
    let lat = (y0 + y1) / 2 - 12 / k
    // Keep the pin (and its label) inside: 80px from the sides, 100px from
    // the top, 60px from the sheet.
    const c = this.viewCenter()
    const mapBottom = H - 28
    const px = (near360(city.lon, lon) - lon) * k
    const py = -(city.lat - lat) * k
    const maxX = W / 2 - 80
    const minY = 100 - c.y
    const maxY = mapBottom - 60 - c.y
    if (px > maxX) lon += (px - maxX) / k
    if (px < -maxX) lon += (px + maxX) / k
    if (py < minY) lat += (minY - py) / k
    if (py > maxY) lat -= (py - maxY) / k
    return { lon, lat, zoom: Math.max(1, k / this.baseK()) }
  }

  private view(city: City, ms?: number) {
    if (this.isDesk()) return this.flyTo(city.lon, city.lat, this.cityZoom(), ms)
    const f = this.countryFrame(city)
    this.flyTo(f.lon, f.lat, f.zoom, ms)
  }

  /* ---------- public API ---------- */

  /** Opening move: whole world → (phone) the country / (desktop) the city. */
  intro(city: City | null) {
    this.cam = { ...WORLD }
    if (!city) return
    this.pins[0] = city
    this.drop.set(city, 0)
    this.introTimers.push(
      setTimeout(
        () => {
          if (this.destroyed) return
          this.view(city, 1700)
          this.introTimers.push(
            setTimeout(() => !this.destroyed && this.dropAnim(city), this.reduced ? 0 : 1300),
          )
        },
        this.isDesk() ? 350 : 900,
      ),
    )
  }

  private clearIntro() {
    this.introTimers.forEach(clearTimeout)
    this.introTimers = []
  }

  /** Place the pins, drop the one that changed, and frame the result. */
  setPins(main: City | null, second: City | null, split: boolean, dropped: City | null) {
    // A pick during the opening move wins over its delayed flight / drop.
    this.clearIntro()
    if (this.pins[0] && this.pins[0] !== main) this.drop.delete(this.pins[0])
    this.pins = [main, second]
    this.split = split
    if (dropped) this.dropAnim(dropped)
    if (main && second) {
      const bl = near360(second.lon, main.lon)
      const d = Math.hypot(bl - main.lon, second.lat - main.lat)
      this.flyTo(
        (main.lon + bl) / 2,
        (main.lat + second.lat) / 2,
        Math.max(1, Math.min(this.cityZoom(), (0.55 * 360) / Math.max(d, 1))),
      )
    } else if (main) this.view(main)
  }

  zoomIn() {
    this.flyTo(this.cam.lon, this.cam.lat, Math.min(this.maxZoom(), this.cam.zoom * 1.6), 300)
  }

  zoomOut() {
    const z = Math.max(1, this.cam.zoom / 2)
    // At full zoom-out, centre the whole world so no continent is split at the edge.
    if (z <= 1.05) this.flyTo(WORLD.lon, WORLD.lat, 1, 600)
    else this.flyTo(this.cam.lon, this.cam.lat, z, 300)
  }

  /* ---------- pointer: drag to pan, tap to pin ---------- */

  private onDown = (e: PointerEvent) => {
    // One pointer drives the map; a second finger is ignored.
    if (this.down) return
    this.down = { id: e.pointerId, x: e.clientX, y: e.clientY, cam: { ...this.cam }, moved: false }
    this.canvas.setPointerCapture(e.pointerId)
  }

  private onMove = (e: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const down = this.down
    if (down) {
      if (e.pointerId !== down.id) return
      const dx = e.clientX - down.x
      const dy = e.clientY - down.y
      if (!down.moved && Math.hypot(dx, dy) > 6) {
        down.moved = true
        this.canvas.classList.add('dragging')
        cancelAnimationFrame(this.flight)
      }
      if (down.moved) {
        const k = this.baseK() * this.cam.zoom
        this.cam.lon = down.cam.lon - dx / k
        this.cam.lat = Math.max(-60, Math.min(75, down.cam.lat + dy / k))
      }
      return
    }
    let best: City | null = null
    let bd = 14
    for (const c of this.shownCities()) {
      const p = this.proj(c.lon, c.lat)
      const d = Math.hypot(p.x - x, p.y - y)
      if (d < bd) {
        bd = d
        best = c
      }
    }
    this.hover = best
  }

  private onUp = (e: PointerEvent) => {
    const down = this.down
    if (down && e.pointerId !== down.id) return
    this.canvas.classList.remove('dragging')
    this.down = null
    if (!down || down.moved) return
    const r = this.canvas.getBoundingClientRect()
    const g = this.unproj(e.clientX - r.left, e.clientY - r.top)
    const city = snapToCity(this.data.cities, g)
    this.opts.onTap(city, this.hover === city)
  }

  // The browser took the gesture over (scroll, system gesture): drop it.
  private onCancel = (e: PointerEvent) => {
    if (this.down && e.pointerId !== this.down.id) return
    this.down = null
    this.canvas.classList.remove('dragging')
  }

  private onLeave = () => {
    this.hover = null
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault()
    // The wheel takes over from any flight in progress.
    cancelAnimationFrame(this.flight)
    this.cam.zoom = Math.max(1, Math.min(this.maxZoom(), this.cam.zoom * (e.deltaY < 0 ? 1.12 : 0.89)))
  }
}
