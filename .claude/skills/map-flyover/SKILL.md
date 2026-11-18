---
name: map-flyover
description: Create a 3D map flyover animation for a real estate listing or project. Produces an interactive 3D web page (camera flies in, orbits the property, draws lines to nearby places with distances, ends on a call to action) and records it as MP4 videos for Instagram or Reels (vertical) and YouTube or websites (landscape). Use when an agent asks for a 3D map, aerial or drone-style flyover, location video, map animation, or "show what's nearby" visual for a property or development.
---

# 3D map flyover

Files in this skill:
- `template.html`: the 3D tour page, built on MapLibre GL with free OpenFreeMap tiles and 3D buildings. Everything property-specific lives in the `CONFIG` block near the top of its script.
- `scripts/record.cjs`: renders the page frame by frame into a smooth MP4.

## 1. Gather inputs
Ask for anything missing, in one short list:
- **Property:** address or exact location, title, price, beds, baths, square feet, and whether it's a single home, a development, or a lot.
- **3–6 nearby places to highlight:** parks, trails, transit, shopping districts, downtown, beaches, hospitals, or major employers. The agent can name them, or you can suggest some and get them confirmed.
- **Agent details for the end card:** name, brokerage, phone, and call-to-action text.
- **Outputs wanted:** interactive page, vertical video (1080×1920), landscape video (1920×1080), or all three.

## 2. Get accurate coordinates
- Coordinates are **[longitude, latitude]**, so check the order.
- Use coordinates the agent gives you, or look them up (web search, or a geocoder if the network allows it). **Never guess coordinates or invent places.** A pin in the wrong spot misleads buyers.
- After the first test render, look at a close-up frame and confirm the pin sits on the right building or street, not in a park or a river. Adjust it if needed.
- For privacy and safety, the agent may prefer a pin at the block level rather than the exact house, especially for occupied homes.

## 3. Build the page
1. Make a project folder, for example `3d-map/<slug>/`, and copy `template.html` to `index.html` inside it.
2. Edit only the `CONFIG` block: `property`, `places`, `rings` (radius circles in miles), `agent`, and `endCta`. Set `sample: false` for a real listing.
3. The timeline builds itself from `CONFIG`: overview, fly in, orbit the home, a visit to each place with a line drawn to it, a return orbit, then the end card. It lasts about 14 seconds plus 4.2 seconds per place.

The page works in any modern browser and on GitHub Pages, with no API key. Viewers can press **Pause**, **Restart** or **Explore**. Dragging the map pauses the tour.

## 4. Preview and check
Render a few still frames before recording. Load the page with `?mode=video` and call `window.renderAt(t)` at times such as 2, 10, the middle of each place visit, and the end. Check that:
- The pin is in the right place and the labels aren't cut off in either shape.
- The captions and distances read correctly.
- The end card text is readable.

## 5. Record the videos
```bash
node scripts/record.cjs <path/to/index.html> tour-vertical.mp4 --size 1080x1920 --fps 30
node scripts/record.cjs <path/to/index.html> tour-landscape.mp4 --size 1920x1080 --fps 30
```
- This needs Playwright with Chromium, and ffmpeg.
- **Network:** the browser must reach `tiles.openfreemap.org`, which serves the map, and `unpkg.com`, which serves the map library. If `unpkg.com` is blocked, run `npm install maplibre-gl@4.7.1` in a scratch folder and pass `--maplibre <that folder>/node_modules/maplibre-gl/dist`.
- Rendering is deterministic and frame by frame, so videos come out smooth even on slow machines.

## 6. Rules
- **Fair housing:** highlight places and amenities, never the people who live nearby. Don't call areas "safe", "family-friendly" or "exclusive". Don't add school rankings to the map.
- Distances are **straight-line** and the page says so. Walk times are rough estimates at 3 mph. Don't present drive times unless you have a real routing source.
- Keep the map attribution (OpenFreeMap, OpenMapTiles, OpenStreetMap) visible. The tile license requires it.
- Many states require the brokerage name on agent advertising, so keep it on the end card.
