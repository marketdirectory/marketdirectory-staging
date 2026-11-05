# Concept A — Lens into Local — isolated Market Directory hero prototype

**Preview path**: `public/preview/market-hero-v13a-lens/index.html` in the original source repository; `preview/market-hero-v13a-lens/index.html` in the staging-output repository.

Elegant editorial lens, persistent UK map, larger role scenes. CSS 3D rotation with distinct shopper/trader/organiser illustrations.

Design constraints: original Market Directory headline, subtitle and final UI design preserved. Exactly one native HTML search form; `Search` submits `query` to the public directory. Near Me requests browser geolocation for a directory handoff (not a substitute for production's existing geolocation implementation). Original React homepage handlers/autocomplete must be reused on any integration. The original staging homepage, V11, V12 and V12.1 are untouched.

**Technical**: standalone HTML/CSS/JS, no application framework or WebGL requirements, no proprietary model, no external generated images. Location dots are illustrative (not market records) and pulse independently of scroll; reduced-motion renders immediately usable search. This is an artistic CSS-3D magnifier, NOT a GPU geometry mesh; validate visual standard accordingly.

**QA**: local Chromium Playwright viewport/scroll checks at 1440x900, 390x844 and 320x700 across 5 scroll phases per viewport, with no page JavaScript errors, no horizontal overflow, one search form, and non-blank final states. Reduced-motion and skip-to-search checked; role navigation also checked in Concept C. **Hosted preview publication and live environment have not been verified.**

**Approval**: standalone design preview only; merge is not requested. If chosen, integrate motion into the existing React homepage using real search/navigation behaviour after GPU/visual/device acceptance.
