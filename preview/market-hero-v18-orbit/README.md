# V18 — Three-Sided Market World (isolated review preview)

The production homepage and V14–V17 preview concepts are **untouched**. This is a separate art-direction review, not an approved homepage replacement.

Hosted preview (after staging deployment): https://cms.marketdirectory.co.uk/preview/market-hero-v18-orbit/index.html

## What is real
- Live three-role CSS3D photo carousel for Shoppers, Traders and Organisers. Arrow/tab controls rotate 120 degrees; no MP4, video, or scroll-seeked frame sequence.
- Three distinct photoreal market role portraits generated with Higgsfield GPT Image 2.6; cost estimate for all three was 0.75 credits exact. No video credits spent.
- A procedural Three.js latitude/longitude WebGL globe, rendered behind the CSS3D portraits when available; responsive no-WebGL carousel fallback.
- Original headline/copy, orange brand, real HTML form, Near Me, buttons and market links. No changes to production auth, data, billing or homepage.

## Browser QA
Chromium Playwright used set_content in the isolated browser because the runner blocks all external HTTP/file navigation. Remote portrait URLs were substituted with local image crops for layout testing, and the CDN-dependent Three.js module was omitted from local QA. The deployed preview retains the true source images and optional real-time WebGL.
Tested viewports: 1440x900, 390x844, 320x700.
Sequence: Shoppers -> Traders (-120 deg) -> Organisers (-240 deg) -> Traders (-120 deg). Tests confirmed the expected state, one accessible search form, zero JS page errors and no horizontal overflow at all three sizes. Reduced-motion viewport tested.

## Before any production integration
- Review actual hosted images/WebGL on a desktop GPU and phone. Offline QA did not establish external asset availability or device FPS.
- Validate search autocomplete/production React integration and target links, and optimise imagery (WebP/AVIF) before launch.
- Self-host/bundle Three.js instead of a CDN for release and add complete WebGL failure telemetry.
- Get explicit visual sign-off. Do not let this experimental preview block MarketDirectory's user-signup-first launch.
