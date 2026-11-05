# Market Directory — V14 C design preview

Isolated design review only. Does not modify the React homepage or real search/autocomplete handlers.

## Changes
- Two physical 180-degree flips around the Y axis, forming a 360-degree chapter sequence.
- Three readable card designs: photographic shopper, illustrated market stall, illustrated organiser plan.
- 28 independent ambient light particles and subtle stall bulb lights.
- More prominent single search interface, visible immediately.
- Accessible reduced-motion chapter selector and mobile clearance.

## Test status
Local Chromium/Playwright checks at 1440×900, 390×844 and 320×700 across multiple scroll positions showed one search form, no JavaScript exceptions, valid role transitions and no horizontal document overflow. These are standalone prototypes, not production-integrated components. Full hosted-page behaviour, real search autocomplete/geolocation and cross-device GPU performance require separate QA.

## Version preservation
Previous V11/V12/V13 previews remain unchanged. No production merge.
