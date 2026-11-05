# QA — Concept C — Role-first Carousel

- Chromium automated visual checks: 3 viewports x 5 scroll points (15 observations), no exceptions or horizontal overflow.
- Full ending: visible title, 1 usable native search form; no blank ending or duplicate forms.
- Market imagery loaded successfully and role/state transitions verified at all sampled points.
- CSS uses responsive layouts at desktop/tablet/mobile; reduced-motion disables continuous pulses and makes search available immediately.
- The screenshots and structured report are captured locally in the build workspace; not included in this deployed preview to avoid increasing page load.
- C role selector: click changes chapter and scroll position; reduced-motion click switches immediately.
- Limitations: local QA used Playwright's inlined page content due blocked local navigation; served site deployment verification and accessibility device audit not independently completed.
