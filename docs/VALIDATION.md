# Validation — 1.2.0 preview

Date: 2026-09-16. Platform: Windows x64. Node.js 24.14.0, Electron 44.4.0, electron-builder 26.15.3.

## Completed locally

- 43 automated tests passed: token pricing and subsets, legacy parsing, incremental scans, deduplication, quota snapshot isolation, stale estimates, quiet alerts, billing boundaries, filtering, report privacy and three-language catalogs.
- Packaged product tests passed: project → session → record, data-health filtering, keyboard chart navigation, monthly billing and quiet settings, compact/pinned window, anonymous HTML export, source removal retaining history and localized overview.
- Packaged localization tests passed: Chinese, English and Dutch pages, details, About, validation errors, narrow Dutch layout and preference persistence across restart.
- Packaged quota integration passed: conditional forecast rendering, once-only 20% and 5% alerts, and observed reset notification. Native delivery was intercepted by the test.
- Vendored native engine: upstream usage/store/pricing tests and synthetic adapter checks passed. This engine is **not enabled or bundled as a binary** in the desktop release.
- Synthetic 10,000-event query benchmark: median 76.4 ms in the local test environment. This is not a cross-product benchmark or an end-to-end application performance guarantee.
- Publication uses a reviewed source-file allowlist. No test-results, account files, databases, local caches or node_modules are included. README screenshots use synthetic data.

## Limits of verification

- The quota integration test uses simulated account data and intercepts the OS notification call. It does not verify actual toast appearance or delivery under Windows notification policies.
- No clean-VM installer/uninstaller certification, code signing, multi-device synchronization test or live account test for every Codex version.
- Modern independent request/compaction accounting, mixed counter scopes and fork histories are not fully handled by the active collector. The release does not claim complete or bill-grade totals.
- GitHub Actions is configured separately; local results are not a claim that remote CI has already passed.

See RELEASE.md and COMPATIBILITY.md for current boundaries. Test scripts that use real local records are manual-only and are excluded from automated workflows.
