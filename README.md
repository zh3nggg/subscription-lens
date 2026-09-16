# Subscription Lens

**1.2.0 Preview · Windows x64.** [Download](https://github.com/zh3nggg/subscription-lens/releases) · [Roadmap](ROADMAP.md) · [Third-party notices](THIRD-PARTY-NOTICES.md)

Full CodexBar/codex-usage Codex parity is not complete. The active collector does not fully reconcile modern independent request/compaction records, mixed counter resets or inherited fork history; totals may undercount or overcount. The new vendored accounting engine is not enabled yet. See [release boundaries](docs/RELEASE.md).

![Overview using synthetic data](docs/images/overview.png)

[English](README.md) · [简体中文](docs/README.zh-CN.md) · [Nederlands](docs/README.nl.md)

A local Windows desktop monitor for Codex subscription usage. View recorded tokens, subscription limits, API-equivalent costs and a comparison with your plan payment.

## Install

Download the Windows x64 installer or portable ZIP from this repository's **Releases** page. Run the installer, or extract the ZIP and open `Subscription Lens.exe`.

1. Select **Start monitoring** to read the default Codex folder, or **Choose folder** for a custom folder containing `sessions` or `archived_sessions`.
2. Open **Connections → Connect account** to query limits through your locally installed Codex. If signed out, use **Sign in to ChatGPT**.
3. Under **Settings**, enter your billing dates, plan payment and extra credit payments in USD. The end date is exclusive. Choose manual dates or automatic monthly renewal.
4. Choose **Language**: system default, Simplified Chinese, English or Dutch, then **Save**. The choice takes effect immediately and is preserved after restart. Other system languages default to English.

No API key, Node.js, Python or Docker is needed to run the app. Account queries require an installed Codex executable; local usage monitoring works without an account connection.

## Features

- Incremental local usage collection every 15 seconds, with SQLite storage and duplicate handling.
- Official Codex account queries: limits every 60 seconds when connected; account token summary approximately every 10 minutes.
- API-equivalent costs with separate input, cache read, cache write and output categories. Reasoning tokens already included in output are not charged twice.
- Search, model filters, CSV export, price catalog import/export and billing comparison.
- Light/dark themes, optional tray operation and Windows startup.
- Chinese, English and Dutch interface, native dialog titles and tray menus; localized numbers and dates.

## Working with your subscription

- **Know when to slow down.** The overview prioritizes account capacity and reset time. Recent-pace estimates require at least three observations, 15 minutes and a measurable change in the same account/window/reset. They use up to two hours of observations, never local token-to-quota guesses. Stale data (over three minutes), resets and counter corrections suppress unreliable estimates. Forecasts assume your recent pace continues; they are not guarantees.
- **Stay in your work.** Open Compact view with Ctrl+Shift+M; optionally pin it above other windows. Escape restores the dashboard. A tray click opens this view when tray mode is enabled.
- **Get quiet alerts.** Opt into alerts at 20% and 5% remaining and observed quota recovery. Alerts are deduplicated per window and account. Quiet hours default to 22:00–08:00 local time. The app must remain running; Windows notification settings can suppress delivery.
- **Find expensive work.** Select a project or chart date, sort sessions by cost or recency, then inspect the exact records. Ctrl+K opens search. Session totals count each record once; subagent rows show their own usage, not an inclusive parent total.
- **Keep billing current.** Choose Monthly renewal and your renewal day. Short months clamp to their last day without changing the anchor. Plan payment repeats; extra payments apply only to the current cycle. Existing installations keep manual dates until you change the mode.
- **Check the evidence.** Data health shows unpriced reasons, parsing issues and price snapshot date, with direct links to affected records and sources. Pricing coverage does not prove complete account history. Previous-period comparisons use the immediately preceding interval of equal elapsed length, not a calendar-month forecast.
- **Share without revealing projects.** Preview and export a self-contained HTML summary. It includes totals, pricing coverage and date range, but no account identity, project names, paths or session IDs. Nothing is uploaded automatically.

Quota observations are stored locally for up to three days, capped at 25,000 rows. No new runtime dependencies, cloud service or model calls were added for these features.

## Data and estimates

The app reads Codex records without changing them. It stores usage metadata, including project names, but not chat bodies. Authentication is managed by Codex; the app does not ask you to paste cookies or tokens.

Data is saved in `%APPDATA%\Subscription Lens`. Uninstalling retains data by default. The portable ZIP uses the same user data location. Set `LENS_DATA_DIR` for a custom location. Do not share a live database between devices.

The bundled prices are the **2026-09-16 Standard USD snapshot**. These rates are applied to collected history, not historical prices at each event's time. Fast/Batch, regional surcharges and tool fees are not included. Unknown models or incomplete pricing remain unpriced. Updating the catalog recalculates existing records.

API-equivalent cost is an estimate, not a bill or guaranteed savings. Enter your actual payment to compare. Incomplete collection can understate the total value.

Local records and account summaries are shown separately, never added together. Regular ChatGPT chats are not supported. Other devices and cloud task details are not collected automatically. Historical local records are not automatically attributed to the currently connected account; select only your own folders on shared computers.

## Build from source

Windows x64, Node.js 24:

```powershell
npm ci
npm test
npm start
npm run dist
```

Dependencies are pinned in `package-lock.json`. `npm run dist` creates an NSIS installer and portable ZIP. Set `ELECTRON_CACHE` and `ELECTRON_BUILDER_CACHE` to project-local folders if desired.

`node scripts/smoke-i18n.cjs` runs isolated desktop localization tests without accessing your account. `node scripts/smoke-product.cjs` validates the product flows. `node scripts/smoke-quota.cjs` uses a simulated account and intercepts native notifications to verify forecasting and alert delivery logic. `node scripts/smoke.cjs` uses your real local Codex records and account. Both write only their test ledgers and screenshots under `test-results`; never distribute that directory. Set `LENS_TEST_EXE` to test a packaged executable.

Translations are maintained in `src/locales.json`: Chinese source keys, then English and Dutch values. `scripts/build-locales.cjs` generates the browser catalog automatically before starting, testing and packaging. User-provided names and paths are never translated. CSV field names remain stable English identifiers for compatibility.

## Release status

Version 1.2.0 · Windows x64 · MIT. The build is unsigned and has no automatic updater. Account interface compatibility depends on the installed Codex version. This is an independent tool, not affiliated with OpenAI.

Official references: [Codex App Server](https://learn.chatgpt.com/docs/app-server), [API pricing](https://developers.openai.com/api/docs/pricing). Electron/Chromium license notices are included in the binary distribution.
