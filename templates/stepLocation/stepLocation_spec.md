Screen 20 Location Map: Developer Spec
30 sept. 2026 · @Someone
Overview
Screen 20 (step 20 of 21) asks for the user's city on a dotted world map; the city search you already have stays as the data source, and the map is a new visual layer on top of it.
• Prototype: Screen 20 prototype. Its figures below are the values to match.
• Copy (final, nothing else on screen): "SkinAudit uses your general location to understand the environment around your routine." and "Allow location and we'll handle the context automatically. We care about the city you're in, not your home address."
• Controls: the current city (label "Current location", city name, state for US cities, country), a search field with a "Locate me" button, and Back / Next in a pinned footer.
• Not on this screen: no climate, UV, humidity, air or water data. Nothing that hints at what SkinAudit measures appears in the UI or in the page source.
• Hidden for now: the multi-city option, behind a feature flag (see Multi-city feature flag).
Data contract
The map needs five fields per city from your existing place search, plus a reverse lookup; the city list built into the prototype is a stand-in and should not ship.
Field
Used for
Example
City name
Pin label, panel title, footer
New York City
Region / state
Panel line, disambiguating results (shown for US only in the prototype)
NY
Country code (ISO 3166-1 alpha-2)
Country name via Intl.DisplayNames, country highlight, mobile framing
US
Latitude, longitude
Pin position, camera
40.71, -74.01
Population or rank (optional)
Result order, which city dots show at each zoom, tap snapping
8.8M
• Reverse lookup: a map tap and "Locate me" both send a coordinate to your service's reverse geocoding and keep only the city it returns.
• Privacy rule: store the city and country only. Discard the raw tap or GPS coordinate once the city is resolved, and request city-level results (no street addresses).
• Country shapes: the highlight needs each land dot tagged with a country. The prototype precomputes this from Natural Earth boundaries (the world-atlas countries-50m file) at build time; ship it as a static asset (about 180 KB).
Layout
Desktop puts the map behind everything with the panel docked right; below 1024 px the map sits on top and the panel slides up over it like a sheet.
Width
Map
Panel
Side gutter
1024 px and up
Fills the viewport behind the header and footer
440 px wide, right-aligned, vertically centred, max height viewport − 180 px, scrolls inside
32 px
700–1023 px
Top 50% of the viewport, min 320 px
Max 640 px, centred, overlaps the map by 28 px, rounded all corners
32 px
Under 700 px
Top 50% of the viewport, min 320 px
Full width, overlaps the map by 28 px, rounded top corners only
16 px
• Header (fixed): SKINAUDIT wordmark, progress bar at 92%, "20 / 21". The progress bar hides under 480 px.
• Footer (fixed): round Back button, a one-line status ("New York City, United States"), Next. Respect the bottom safe-area inset.
• Map controls: + / − buttons bottom-left and a "Tap the map to drop a pin" hint centred, both 48 px above the map's bottom edge; on desktop they sit 108 px up, clear of the footer. The hint hides after the first pin.
• Visible map centre: on desktop, the middle of the area left of the panel (x = (width − 480) / 2); on phones, the middle of the map strip, nudged up 10–14 px for the sheet overlap.
Map rendering
The map is a canvas of about 14,900 land dots on a 1° grid, drawn every frame in a flat (equirectangular) projection that wraps left to right.
• Scale: at zoom 1 the whole world (360°) fits the visible map width, so pixels per degree k = visible width ÷ 360 × zoom. Maximum k is 40.
• Wrap: each longitude draws at its copy nearest the camera (lon + 360 × round((camera lon − lon) ÷ 360)). No edge, no seam in view except at full zoom-out, which re-centres (see Zoom rules).
• Dots: radius 0.3 × k, clamped to 0.7–3.2 px, colour sand #d6c3ae.
• Dot opacity: 0.13 for the rest of the world, 0.40 for the selected country, and up to +0.55 more within 12° of a pin (fading to zero at 12°).
• City dots (tappable, cream at 55%): the 150 largest cities when k < 6, 600 when k < 14, 2,500 beyond that.
• Pin: sand teardrop 26 px tall with a dark centre dot; a second-city pin is outlined instead of filled. Label pill above it: 22 px tall, 12.5 px DM Sans, kept 6 px inside the map edges.
• Edge fade: a radial vignette darkens the corners to the page background.
• Retina: canvas at device pixel ratio, capped at 2.
Animation timings
The screen opens on the whole world, pauses, then flies to the user's city (desktop) or country (phone) in 1.7 s, and the pin drops as the flight lands.
Motion
Delay
Duration
Easing / notes
Opening pause on the world view (centred 12°E, 12°N, zoom 1)
—
350 ms desktop, 900 ms phone
Pin label hidden until the pin lands
Opening flight
after the pause
1,700 ms
Cubic ease-in-out
Opening pin drop
1,300 ms into the flight
520 ms
Falls 40 px with a damped bounce, fades in over the first third
Flight to a new city (search, tap, Locate me)
0
1,100 ms
Cubic ease-in-out; zooms out mid-flight by sin(πt) × min(1.2, distance° ÷ 40), never below zoom 1
Pin drop on a new city
0
520 ms
As above
+ / − buttons
0
300 ms
Zoom × 1.6 in, ÷ 2 out
Full zoom-out (re-centre)
0
600 ms
Flies to 12°E, 12°N, zoom 1
Pulse rings under the main pin
continuous
2,200 ms loop
Two rings half a cycle apart, radius 6 → 36 px, opacity 0.55 → 0
Toast ("Pinned to Lagos, the nearest city")
0
visible 2,200 ms
—
• Reduced motion (prefers-reduced-motion: reduce): flights jump straight to the end, the pin appears without dropping, and the pulse rings don't animate.
Zoom rules
Desktop zooms to the city at a fixed 14 px per degree; phones frame the country around the city, clamped so huge and tiny countries both read well, and always keep the pin clear of the edges.
Desktop: fly to the city at k = 14 px per degree.
Phone (country framing), in order:
1. Take the selected country's land dots that lie within 26° of the city. This drops far-off territory, so New York frames the eastern and central US, not Alaska and Hawaii.
2. If fewer than 4 dots are left (Singapore, Hong Kong, Dubai, Honolulu), skip framing and show a city view at k = 24.
3. Otherwise take the bounding box of those dots. Fit it into the map strip less padding (width − 40 px, height − 28 px sheet overlap − 70 px for the pin label), then use 86% of that scale.
4. Cap k at 17, so small countries (France, Japan) keep some of their neighbours in view.
5. Centre on the box, nudged up 12 px worth of degrees so the pin label clears the top.
6. Pin safe zone: if the pin would land within 80 px of the left or right edge, within 100 px of the top, or within 60 px of the panel, shift the camera toward the city until it doesn't.
Two cities (flag on): centre on the midpoint (taking the shorter way around the globe) at zoom min(the single-city zoom, 0.55 × 360 ÷ distance in degrees), never below 1.
Limits: zoom 1 (whole world) to k = 40. Pressing − down to zoom 1 re-centres on 12°E, 12°N so no continent is split at the edge. Dragging clamps latitude to 60°S–75°N; longitude is unlimited because the map wraps.
Interactions
There are three ways to set the city (search, tap, Locate me), and all of them end in the same flight and pin drop.
Input
Behaviour
Search field
Suggestions after the first character, max 6. Order: name starts with the text, then a word inside the name starts with it, then contains it; ties by population. Accents ignored ("reykj" finds Reykjavík).
Search narrowing
"paris, tx" or "springfield il" filters by country code, country name or US state. The space form is tried only when the whole text finds nothing.
Search keyboard
↑ / ↓ move the highlight, Enter picks it, Esc closes the list. Picking clears the field and blurs it.
Suggestion row
City name on the left; state (US) and country on the right in muted text.
Tap on the map
A press that moves under 6 px counts as a tap. Snap to the nearest city of 50,000+ people if one is within 1.5°, otherwise to the nearest city. Show the toast unless the tap was right on a city dot.
Drag
Pans the map; cancels any flight in progress. Cursor: crosshair, grabbing while dragging.
Mouse wheel
Zoom × 1.12 per notch in, × 0.89 out, within the limits above.
Hover (desktop)
The nearest city dot within 14 px brightens and shows its name.
+ / −
See Animation timings.
Locate me
Label changes to "Locating…", browser location → reverse lookup → city, then the normal flight. Always sets the main city. Toast: "Found you in <city>".
Footer status
"<City>, <Country>"; with two cities, "<City A> and <City B>".
In the live app, suggestions come from your current place search service; the prototype's ranking rules above are a fallback reference only.
Multi-city feature flag
The "I split my time between two places" option is built but off; ship it behind a flag so it can be turned on without new UI work.
• Flag: FEATURES.multiCity (default false). In the prototype the whole block is hidden until the flag is on.
• Preview: add #multicity to the end of the prototype link. Checked on 30 Sep 2026: without it the toggle is hidden; with it the toggle shows, and adding Tokyo as a second city gives the footer "New York City and Tokyo".
• When on: a switch row sits under the search. Turning it on reveals a "Main city / Second city" choice (Second city preselected), and the search placeholder becomes "Search your second city". Search or tap then places the second pin (outlined teardrop, label "<City> · second"; the main one reads "· main"). The map frames both pins (Zoom rules).
• Turning it off removes the second city and flies back to the main one.
• Rules: the second city can't be the same as the main one (toast: "That's already your main city"); Locate me always sets the main city.
• Current limit: two cities. Moving to three or more would turn the switch into a list with "+ Add another city"; not built yet.
Edge cases and QA
Most of these are handled in the prototype; the last three are open questions the live build needs an answer for.
[ ] Tiny countries (Singapore, Hong Kong, Dubai, Honolulu) fall back to a city view on phones, not an empty-looking frame.
[ ] Huge countries: New York, Seattle, Sydney and Cape Town frame on a 390 × 844 phone with the pin inside the safe zone.
[ ] Date line / wrap: searching Tokyo from New York flies the short way; dragging keeps going around the globe with no gap.
[ ] Full zoom-out shows every continent whole, re-centred on 12°E, 12°N.
[ ] Coastal cities: pin and label never touch the map edge, header or panel (safe zone).
[ ] Same-name cities: "Paris" lists Paris, France first; "paris, tx" finds Texas.
[ ] Two far-apart cities (flag on): both pins visible, framed across the shorter side of the globe.
[ ] Reduced motion: no flight, drop or pulse animation.
[ ] Keyboard only: search, pick a suggestion and reach Next without a mouse.
[ ] Page source contains no climate or measurement data.
[ ] Open question: location permission denied. Suggested: keep the current city, show "We couldn't find you. Search for your city instead." and focus the search field.
[ ] Open question: no search results. The prototype shows an empty list; suggested: one line, "No city found. Try a nearby larger city."
[ ] Open question: tap in the ocean far from land. The prototype snaps to the nearest city anywhere; decide whether to cap the snap distance.