# Validation — 1.4.0-beta.7

Windows x64 · Node.js 24.14.0 · Electron 44.4.0 · electron-builder 26.15.3.

## Automated checks

- 61 unit/integration checks passed locally, including device identity, anonymous package export/import, imported-cost preservation, automatic safe discovery, model-mix calibration, provider imports, cache semantics, price rules, translations and persistent installer identity.
- Desktop checks cover provider → model → requests, Tokens/cost switching, every dashboard tab, overview no-scroll behavior, pagination and Chinese/English/Dutch layouts at 760×560, 820×600, 1024×768 and 1320×900 content sizes.
- Existing product, localization and simulated quota tests are part of the release checks. Actual notification delivery is intercepted; these tests do not establish Windows toast delivery under every policy.
- Desktop smoke verifies the device page, its device filter and contextual terminology help in addition to the quota forecast flow.
- Connector and layout fixtures use synthetic records. A packaged startup smoke also verified the existing local Codex import and account connection; it copied no credentials, kept results outside the release artifacts and made no paid model requests.

## Limits

- No clean-VM installer/upgrade certification or code signature. Installer identity is pinned to the 1.2.0 identity; the NSIS upgrade path retains app data. Do not mistake configuration verification for a live upgrade test.
- No verification of official provider invoices, balances or every upstream log format. Source-reported costs are not authenticated invoice data.
- Modern Codex request/compaction accounting and inherited forks remain incomplete in the active collector. Earlier native-engine component tests do not establish desktop integration or complete accounting.
- GitHub Actions remains subject to account billing availability. Local results do not assert remote CI success.

Release artifacts are accompanied by SHA256 checksums. No account files, usage databases, test-results, credentials, caches or development dependencies are included in the source archive. Screenshots use synthetic data.
