# V12 quality verification — 5 November 2026

## Verified locally (real headless Chromium, no WebGL)

- Five responsive static compositions: 1440×900, 1920×1080, 768×1024, 390×844, 320×700. Each with one search form, 20 map outlines, 16 location rings, a loaded original market photo and no page exceptions or horizontal overflow.
- Four responsive sizes × six scroll stages (0%, 18%, 35%, 55%, 78%, 100%) = **24/24 fallback behaviour checks**. No reported page JS errors or horizontal overflow; role label switched Shopper → Trader → Market organiser; form became interactive after short scroll; and the last frame retained all the content.
- Text entry check: initially 0/31 letters fully visible, then 22/31, then 31/31; GSAP path uses the same visible staggered character transforms, but was not executed in the local restricted browser.
- At rest, the orange map CSS pulse advanced by 250ms, with animation state `running`.
- Reverse scroll correctly reset role label to Shopper and disabled the search before its reveal point.
- Reduced motion: one visible interactive search form, no pulsing animation, no horizontal overflow.
- `node --check` succeeds on `main.js`, `magnifier.js`, `worlds.js` and `fallback.js`.

## What remains unverified and MUST be approved before merge

The Chromium installed in this environment reports WebGL unavailable, even with software rendering flags. I have **not** tested its WebGL-backed mesh rendering on a real GPU, the exact GSAP + Three.js network-load path, hosted-site serving, Safari/iOS device performance, or the final integrated React search suggestions and Near Me behaviour. These are required acceptance gates. The fallback QA is not evidence that live GPU rendering looks premium.

**Next review:** load the staging URL on a GPU-capable Chrome/Edge device; record the full scroll from arrival to search and in reverse; inspect object materials, miniature model clarity, role changes, 3D side profiles, headline entrance, timing and actual Search/Near Me in the eventually integrated React build.

## Safety/release discipline

Fresh `design/v12-cinematic-3d-scroll` branch based on staging. Never merge automatically. No database, auth, hosting configuration, production or existing V11 PR changes. Only isolated HTML/JS/CSS and images under `public/preview/market-hero-v12`. Third-party GLB not bundled: original procedural model produced from visual reference, no extractable licensed model.