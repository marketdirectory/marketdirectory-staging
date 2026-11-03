# MarketDirectory Photo Companion — PUBLIC auto-update channel

This branch hosts **small, versioned patches** for the locally installed, read-only MarketDirectory Photo Companion (Windows/Node). **It is deliberately separate from the staging-output website's `main` branch.** None of these commits deploy the CMS, execute Supabase SQL or touch production.

## How updates work

- The local Windows tool v1.2.0 includes the immutable `updater.mjs` bootstrap and all nine original runtime files; it runs at `http://127.0.0.1:18421`.
- The bootstrap checks [`channel.json`](channel.json) on startup and every ten minutes while the app is open (or immediately when the user clicks **Check now**).
- Each [versioned patch](releases/1.2.1.json) changes only explicitly allowed runtime filenames. The channel pins the patch byte length and SHA-256, and the patch pins the SHA-256 and bytes of **all nine resulting application files**. The updater checks everything and executes offline tests before swapping.
- On success, the launcher restarts the Node localhost server on the same port and the browser automatically refreshes. On failure, it retains or restores the last working runtime. No GitHub login or key is required because this branch/repository is public.
- Only the `runtime/` contents change; **`updater.mjs` and the launcher .bat are not remotely writable**.

## First live update: v1.2.0 → v1.2.1

The v1.2.1 patch is intentionally tiny and replaces only `version.json`. It proves the update/download/test/restart path without any change to database permissions, content, sources, keys or production. Version is read dynamically by the local server, so it changes to v1.2.1 after restart.

## Future publishing protocol

1. Build a tested next runtime from the last released version. Preserve the existing review-only market data and endpoint restrictions unless an independently permitted project release says otherwise.
2. Add `releases/<version>.json` with `baseVersion`, `version`, `changes` (base64 content, original SHA-256, bytes) and `finalFiles` (exact SHA-256+bytes for the nine runtime files). Only allowed runtime filenames are permitted.
3. Verify the release JSON bytes and SHA-256 and all nine resulting runtime file hashes; run `node --test updater.test.mjs runtime/tests.mjs runtime/probe.test.mjs` in a copy.
4. **Update `channel.json` last** to append the new release version/hash/length and raise `latestVersion`. Keep all earlier releases in order for offline clients to catch up.
5. Keep this branch reviewed and limit GitHub write permissions. **SHA-256 is an integrity check, not a cryptographic signature: a compromised branch writer could change both payload and hashes.** Use 2FA and branch protection. Never commit credentials or private row exports.

## Boundaries

The companion only probes the staging public Auth/Data API health using a *publishable* key, verifies public photo SHA-256s and locally reviews user-selected CSVs. It has no Supabase privileged read/write endpoints, never links listings, and cannot substitute for the platform-refused R3 private query. The 20 photo paths and rights/crop credits remain verified but the listings remain unlinked until a separately permissible database release.

Source repository: `marketdirectory/marketdirectory-staging`, **branch `tool/photo-companion-updates` only**. Do not merge this branch into `main`.
