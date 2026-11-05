# Market Directory — V15C, Three Living Market Worlds

**Independent, noindex standalone design prototype.** No production homepage, search-autocomplete, API, payments, security or database change. V14C and previous previews left intact.

## What's built
- Three photographed market role scenes, matched with warm art direction, image overlays and readable real-HTML typographic content.
- Two-sided CSS 3D rotation controlled by Web Animations API, 760 ms. No SVG-card swap during rotation and no backwards text. Manual role buttons turn the card **in place**; scrolling also selects the appropriate role, with a shortened sticky journey.
- Single always-available search bar, Near Me demonstration, quick links, original headline/subtitle/navigation preserved.
- Mobile layout with search below card, 320px layout adaptation, keyboard navigation, reduced-motion state changes, offscreen page pausing, image-failure gradient fallback.
- Small decorative particles, scene-specific accent colours, no WebGL runtime or paid video.
- \`window.__MDPreview.get()\` / \`window.__MDPreview.select(0|1|2)\` for testing.

## Photo provenance
All images illustrative, chosen for this visual prototype from Unsplash pages marked **Free to use under the Unsplash License**. Do not represent them as photographs of specific Market Directory listed venues.

1. Shopper — Tanya Barrow, "Outdoor market stalls with fresh produce and shoppers": https://unsplash.com/photos/F9WlhIaOEw4 — CDN \`photo-1775328023972-2e94b905b87d\`.
2. Trader — Anshul Paruchuri, "Colorful pottery and crafts displayed on a market stall": https://unsplash.com/photos/0rpaUjlHCb4 — CDN \`photo-1768321481665-b40705ab11ce\`.
3. Organiser — Mike Lerley, "An aerial view of a tent set up in a parking lot": https://unsplash.com/photos/PMV1wnkOwRY — CDN \`photo-1719934113502-d2968bc999d7\`.

Images are loaded from Unsplash CDN instead of committed, so test CDN performance and consider approved self-hosted WebP/AVIF derivatives before a production integration. Planner imagery is **aerial photo**, not yet the proposed 3D diorama: this is a first visual build, not final art approval.

## Test matrix / outstanding
Review at 1440x900, 1280x720, 768x1024, 390x844, 320x700. Test 0/25/33/39/50/63/72/85/100 scroll positions, forward/backwards and role click order 0→2→1→0; no white flash/mirrored type, mobile search unobstructed, no horizontal overflow, reduced-motion, keyboard, fast repeated clicking, slow network and denied geolocation.

No automated browser QA or hosted preview verification is claimed in this commit. This prototype is **not** integrated with the React homepage's actual search-autocomplete/geolocation logic. The existing V15 design spec remains in \`docs/design/market-hero-v15c-spec.md\`.

## Expected preview
If published by the staging preview host: \`/preview/market-hero-v15c-worlds/index.html\`. Do not claim the hosted URL is live until GET-verified.

Next: owner visual review and load/performance QA before any integration.
