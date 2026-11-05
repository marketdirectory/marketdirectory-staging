# Market Directory V12 — Cinematic 3D Hero (isolated design preview)

This directory is an unmerged, standalone design proof built on a dedicated GitHub branch `design/v12-cinematic-3d-scroll`. It does **not** modify the existing `pages/Home.tsx`, search handlers, owner auth or the original V11 design PR. It intentionally follows the four visual/engineering gates agreed with the owner.

## What the preview implements

- **A new premium scene**: warm original market photography on the left, existing brand typographic system and orange palette, accurate UK map on the right (SVG geometry, 16 independent animated pings).
- **Genuine browser-rendered 3D, not a sprite atlas**: `magnifier.js` creates a complete 3D model from geometry: thick toroidal brass/glass rim, physical transmissive lens, dark walnut grip, gold attachments. It spins around its **vertical Y axis** with the solid handle rigidly attached. Reflections come from a small real-time studio PMREM environment and three lights, using ACES Filmic tonemapping. The original downloaded Sketchfab GLB is **not shipped**; the build uses original code-authored geometry in response to its license restrictions.
- **Original miniature worlds**: `worlds.js` builds differentiated shopper, trader and organiser market dioramas from 3D mesh geometry and natural materials. They change when the glass turns edge-on.
- **Single scroll choreography**: GSAP ScrollTrigger drives one master normalized timeline, across about 2.2 viewport-heights of travel. It controls Y rotation, camera push, diorama switches and the original-layout search reveal. The text entrance starts on page arrival with a *per-character* 3D spring, not a simple fade. The search is exactly one form and remains present at the ending.
- **Ambient animation independent of scrolling**: 16 location pulses continue while idle; the lens gently floats in view. Reduced-motion mode disables movements and shows the final search immediately.
- **Progressive enhancement**: `fallback.js` handles the same scroll semantics if CDN modules or WebGL are blocked. An accessible static lens poster and the actual form remain usable. No blank ending.

## Preview setup

The browser must load `https://cdn.jsdelivr.net/npm/three@0.187.0` and `https://cdn.jsdelivr.net/npm/gsap@3.15.0` for the GPU experience. The `index.html` importmap pins versions; production integration should vendor via npm/bundler. Serve this directory over HTTP(S), not `file://`, because ES modules and model-relative URLs require server origin.

For a local preview, run `python -m http.server 8765 --directory public/preview/market-hero-v12` from the project root and open `http://localhost:8765`. If the network blocks the external modules, the page intentionally switches to its accessible static fallback instead.

## Existing homepage integration (not performed)

The source React homepage is `pages/Home.tsx`. It currently owns search suggestion state, handlers and the Near Me logic. On design approval, extract the visual layers into `components/home/V12CinematicHero.tsx`, use `@react-three/fiber` + Drei to mount the scene, replace the prototype search markup with **the existing React search component and handlers**, and preserve the existing `HomeScrollStorySection` only if the editorial story is not duplicated. Do not merge the preview HTML as the live homepage. Do not move this model into the logo or brand identity.

## Review gates and testing limitations

- **Visual gate:** desktop and mobile still compositions from Playwright; current static fallback checked at 1440x900, 1920x1080, 768x1024, 390x844 and 320x700; no horizontal overflow, one form, image loaded, map present.
- **Behaviour gate:** local Playwright tests of the no-WebGL fallback at four viewport sizes × six scroll positions (24 stages): no JavaScript page errors, one form, role changes, no blank final state; search appears on short scroll, pings remain CSS-animated. Node syntax check passes for all JS sources.
- **Not yet verified in this environment:** actual Three.js/WebGL, because the local Chromium disables WebGL even with SwiftShader flags. This **must be run on a GPU-capable browser** (Chrome, Edge, Safari/iOS) before this is described as visually approved or merged. The host preview URL serving status is not verified. Performance/fps and real-world Core Web Vitals must be measured on a hosted preview, not inferred from a screenshot.
- **Functional integration gate:** prototype search action is a simple URL to `/directory`, not the live React autocomplete and Near Me handlers. Do not imply the standalone prototype has the full hosted user journey.
- **Legal gate:** original third-party Sketchfab GLB must not be republished as an extractable standalone file; this preview uses original procedural geometry and retains the uploaded GLB only in the owner's private conversation context.

## Test commands

```sh
node --check main.js
node --check magnifier.js
node --check worlds.js
node --check fallback.js
python qa/qa_standalone.py
python qa/qa_scroll.py
```

Reference: Three.js documentation, GSAP ScrollTrigger pinned timeline docs and Sketchfab Standard Licence. This is a **new branch / fresh commit**, not a modification of V11.