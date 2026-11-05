# Market Directory — V14 B design preview

Isolated design review only. Does not modify the React homepage or real search/autocomplete handlers.

## Changes
- Full-bleed market photography at the final scene.
- Persistent legible editorial text panel.
- Three explicit audience modes (Shopper, Trader and Market Organiser) with scroll-linked indicators and clickable switches.
- One native search form; existing brand copy, links, Near Me handoff and region actions.

## Test status
Local Chromium/Playwright checks at 1440×900, 390×844 and 320×700 across multiple scroll positions showed one search form, no JavaScript exceptions, valid role transitions and no horizontal document overflow. These are standalone prototypes, not production-integrated components. Full hosted-page behaviour, real search autocomplete/geolocation and cross-device GPU performance require separate QA.

## Version preservation
Previous V11/V12/V13 previews remain unchanged. No production merge.
