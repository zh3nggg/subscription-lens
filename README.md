# Subscription Lens

A Windows desktop app for **Codex subscription users** who want to see their remaining quota, understand which projects use their tokens, and choose a model mix that carries their quota to the next reset. It also compares recorded usage at API rates with the subscription payment. No API key is required.

[English](README.md) · [简体中文](docs/README.zh-CN.md) · [Nederlands](docs/README.nl.md)

> **3.0 generation preview.** The published `3.0.0-beta.1` installer still uses the Electron desktop app. Development after beta.1 moves the runtime to Tauri and the pinned CC Switch backend, while retaining Subscription Lens's own sidebar, overview, quota, charts and project/session usage interface. CCS remains the single owner of provider accounts, switching, rollback and the local proxy. Keep 1.6.5 available as a fallback while evaluating previews.

## What you can do

| Task | Features |
| --- | --- |
| Check remaining capacity | Account quota, reset countdowns and recent-pace estimates when enough observations are available. |
| Understand your usage | Compare providers in a ring chart, select one to inspect its models, then drill down to requests or Codex sessions. |
| Plan your model mix | Turn the active quota window's model history and average pace into a recommended mix for the next reset, with confidence and suggested changes per model. |
| Compare usage with your payment | View estimated API-equivalent costs alongside your actual payment for the billing period. |
| Keep limits within reach | Use a compact pinnable window, the system tray and optional low-quota alerts with quiet hours. |
| Compare devices privately | Assign local Codex records to a stable device, filter by device, and transfer anonymous device packages without chat content or paths. |
| Export and share | Export records to CSV or save an aggregate-only HTML report without project names or account identifiers. |

## Provider monitoring in 1.5

Connect Qwen Code, Kimi Code, CodeBuddy Code, Qoder, CC Switch, Claude Code, Gemini CLI or your own API usage file. Qoder Quest sessions are read from the local IDE agent logs on Windows; context snapshots are labeled as token estimates, while native Credits stay separate. Qoder stream capture keeps native Credits separate from API-equivalent USD and skips cumulative result events, so the same request is never charged twice. Domestic model families are attributed to Alibaba Cloud, Moonshot AI, Zhipu AI, MiniMax and DeepSeek through the same provider → model chart. Recorded estimates and source-reported amounts stay distinct from actual invoices. Installed tools in standard folders are detected automatically and can be connected together; custom locations remain available. [Source setup and cost definitions](docs/PROVIDER-MONITORING.md).

The provider and model charts also show average cost per 1M tokens for the selected period. The denominator includes only priced tokens; unpriced usage remains visible and is excluded from the average. Multi-provider views combine connected sources with exact duplicate suppression and flag possible overlaps instead of silently adding ambiguous records.

### Codex provider routing in the 3.0 generation

The published beta.1 adds a **Providers** page for Codex routing. The next Tauri build keeps the Subscription Lens route page visually, while every provider operation opens the original CC Switch provider manager bundled in the same executable. OpenAI Official login uses the separately saved CCS Codex OAuth account; provider credentials, model catalogs, advanced settings, takeover, recovery, hot switching, rollback and Responses/Chat conversion all use the original CCS UI, command boundary and database. Subscription Lens does not keep a second provider store or overwrite CCS switch state. Codex GUI and CLI remain the task interface.

The Codex overview can recommend a model mix from the last 14 days of model usage and the current quota pace. It targets the next reset and shows its confidence. Because OpenAI does not publish an exact subscription-quota weight for each model, this is an adaptive recommendation based on API-equivalent intensity, not a guarantee.

### CC Switch attribution

The 3.0 routing feature embeds the original provider-manager renderer and selected runtime components from [CC Switch](https://github.com/farion1231/cc-switch), pinned to commit `06082e189d65e6d6dbadc35dacdac1ce6c79d89a`. The embedded provider UI, OAuth, proxy, takeover, recovery and protocol-conversion runtime are derived from CC Switch and remain covered by its MIT license. Copyright © 2025 Jason Young. See [third-party notices](THIRD-PARTY-NOTICES.md) for the full attribution and license boundary.

![Subscription Lens provider overview in English](docs/images/providers.en-US.png)

*Overview with synthetic data; no real account or conversation data is shown.*

## Download and get started

**3.0.0-beta.1 Preview · Windows x64.** This is the first 3.0-generation preview after the 1.6.x stable line. The collector does not yet handle all client record formats; totals may be too high or too low. Costs are estimates, not a bill or guaranteed savings. The build is unsigned and has no automatic updater.

[Download 3.0.0-beta.1](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.0.0-beta.1)

For a normal installation, use `Subscription-Lens-3.0.0-beta.1-installer-x64.exe`. Close Subscription Lens, run the installer, and keep the existing installation folder (for example, `D:\SubLens`) if you are upgrading. Because this is a major-generation jump, keep the 1.6.5 installation or its data backup until you have verified the preview. Use `Subscription-Lens-3.0.0-beta.1-electron-x64.zip` for a separate, no-install copy: extract it to its own folder and run `Subscription Lens.exe`; it does not update an installed copy.

1. Select **Start monitoring** to read the default Codex folder, or **Choose folder** for a custom folder containing `sessions` or `archived_sessions`.
2. Open **Connections → Connect account** to query limits through your locally installed Codex. If signed out, use **Sign in to ChatGPT**.
3. Under **Settings**, enter your billing dates, plan payment and extra credit payments in USD. The end date is exclusive. Choose manual dates or automatic monthly renewal.
4. Choose **Language**: system default, Simplified Chinese, English or Dutch, then **Save**. The choice takes effect immediately and is preserved after restart. Other system languages default to English.

The main workspace is designed for windows from 760×560 upward. The Codex first view combines plan status, billing comparison and provider/model distribution. Medium windows place trends and projects in tabs; tall windows reveal them automatically without changing the current source or period.

No API key, Node.js, Python or Docker is needed to run the app. Account queries require an installed Codex executable; local usage monitoring works without an account connection.

<details>
<summary>Usage details and shortcuts</summary>

- **Know when to slow down.** The overview prioritizes account capacity and reset time. Quota estimates require at least three observations across 15 minutes in the same account/window/reset. They use every retained observation in the active quota window, so the average covers the full window rather than only the last two hours. A positive change estimates the average burn rate; a stable window is shown as no observed consumption. Stale data (over three minutes), resets and counter corrections suppress unreliable estimates. Forecasts assume the window's average pace continues; they are not guarantees.
- **Stay in your work.** Open Compact view with Ctrl+Shift+M; optionally pin it above other windows. Escape restores the dashboard. A tray click opens this view when tray mode is enabled.
- **Get quiet alerts.** Opt into alerts at 20% and 5% remaining and observed quota recovery. Alerts are deduplicated per window and account. Quiet hours default to 22:00–08:00 local time. The app must remain running; Windows notification settings can suppress delivery.
- **Find expensive work.** Select a project or chart date, sort sessions by cost or recency, then inspect the exact records. Ctrl+K opens search. Session totals count each record once; subagent rows show their own usage, not an inclusive parent total.
- **Keep billing current.** Choose Monthly renewal and your renewal day. Short months clamp to their last day without changing the anchor. Plan payment repeats; extra payments apply only to the current cycle. Existing installations keep manual dates until you change the mode.
- **Check the evidence.** Data health shows unpriced reasons, parsing issues and price snapshot date, with direct links to affected records and sources. Pricing coverage does not prove complete account history. Previous-period comparisons use the immediately preceding interval of equal elapsed length, not a calendar-month forecast.
- **Share without revealing projects.** Preview and export a self-contained HTML summary. It includes totals, pricing coverage and date range, but no account identity, project names, paths or session IDs. Nothing is uploaded automatically.

Quota observations are stored locally while their quota window is active and for two days after reset, capped at 25,000 rows. No new runtime dependencies, cloud service or model calls were added for these features.

</details>

## Data and estimates

The app reads Codex records without changing them. It stores usage metadata, including project names, but not chat bodies. Authentication is managed by Codex; the app does not ask you to paste cookies or tokens.

Data is saved in `%APPDATA%\Subscription Lens`. Uninstalling retains data by default. The portable ZIP uses the same user data location. Set `LENS_DATA_DIR` for a custom location. Do not share a live database between devices.

The bundled prices are the **2026-09-16 Standard USD snapshot**. These rates are applied to collected history, not historical prices at each event's time. Fast/Batch, regional surcharges and tool fees are not included. Unknown models or incomplete pricing remain unpriced. Updating the catalog recalculates existing records.

API-equivalent cost is an estimate, not a bill or guaranteed savings. Enter your actual payment to compare. Incomplete collection can understate the total value.

Local records and account summaries are shown separately, never added together. Regular ChatGPT chats are not supported. Other devices and cloud task details are not collected automatically. Historical local records are not automatically attributed to the currently connected account; select only your own folders on shared computers.

## Current scope and roadmap

Supports Codex subscriptions and selected local multi-provider records on Windows. Regular ChatGPT conversations and other-device usage are not collected automatically. Full Codex feature parity with CodexBar and codex-usage is not complete.

Version 1.4 adds read-only Qwen Code, Kimi Code and CodeBuddy Code connectors, plus GLM, Qwen, Kimi, MiniMax and DeepSeek attribution through Claude Code, CC Switch or compatible gateways. Legacy formats, quota/credit interfaces and more domestic tools remain on the [acceptance roadmap](docs/DOMESTIC-COMPATIBILITY.md).

[Roadmap](ROADMAP.md) · [Coverage checklist](docs/COMPATIBILITY.md) · [Release boundaries](docs/RELEASE.md) · [Validation](docs/VALIDATION.md)

## Build and contribute

Use Windows x64 and Node.js 24. Electron dependencies are pinned in package-lock.json. The Tauri host also requires Rust and pnpm; its reproducible build applies the checked-in Subscription Lens host patch to the pinned CC Switch submodule, builds the native React renderer, then compiles the same CCS Rust runtime. See [CONTRIBUTING.md](CONTRIBUTING.md) for validation details. The real-account smoke test is manual-only.

```powershell
npm ci
npm test
npm start
npm run dist

# Tauri development host
.\scripts\build-tauri-migration-host.ps1 -Action check
.\scripts\build-tauri-migration-host.ps1 -Action build
```

## Development and acknowledgements

Developed with assistance from **GPT-6 Astra**.

[CodexBar](https://github.com/steipete/CodexBar) informs the quota and desktop interaction requirements. MIT-licensed [codex-usage](https://github.com/zJay26/codex-usage) source is retained with its notices for future accounting-engine integration.

MIT. See [third-party notices](THIRD-PARTY-NOTICES.md) for attribution and licenses. This is an independent project, not affiliated with OpenAI or endorsed by the referenced projects.
