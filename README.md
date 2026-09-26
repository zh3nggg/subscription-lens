# Subscription Lens

> Ubuntu 22.04 x64: a Tauri `.deb` build based on 3.1.1 is available locally. See [Linux installation and build instructions](docs/LINUX-22.04.md).

A desktop app for **Codex subscription users** on Windows and Apple Silicon Macs who want to see their remaining quota, understand which projects use their tokens, and choose a model mix that carries their quota to the next reset. It also compares recorded usage at API rates with the subscription payment. Monitoring needs no API key; third-party routing uses the chosen provider's credentials.

[English](README.md) · [简体中文](docs/README.zh-CN.md) · [Nederlands](docs/README.nl.md)

> **3.1.1 · stable Windows release.** Fixes the overview distribution chart so it follows the selected local or multi-device view. Includes the Tauri migration fixes, CodeBuddy/Qoder collection, quota forecasts, and Cloudflare R2 multi-device statistics. Device snapshots retain calculated API-equivalent costs and keep genuinely unpriced records distinct from zero-cost usage. The original CC Switch provider manager and routing runtime are embedded; no separate CC Switch installation is required. The first reliably usable multi-provider release was 3.0.0. Apple Silicon macOS remains the Electron preview `3.0.0-beta.2`.

## What you can do

| Task | Features |
| --- | --- |
| Check remaining capacity | Account quota, reset countdowns and recent-pace estimates when enough observations are available. |
| Understand your usage | Compare providers in a ring chart, select one to inspect its models, then drill down to requests or Codex sessions. |
| Plan your model mix | Turn the active quota window's model history and average pace into a recommended mix for the next reset, with confidence and suggested changes per model. |
| Compare usage with your payment | View estimated API-equivalent costs alongside your actual payment for the billing period. |
| Keep limits within reach | Use a compact pinnable window, the system tray and optional low-quota alerts with quiet hours. |
| Compare devices privately | In the Windows Tauri app, optionally sync one privacy-filtered Sublens usage snapshot per device through Cloudflare R2; no source logs, chat content or project paths are uploaded. |
| Export and share | Export records to CSV or save an aggregate-only HTML report without project names or account identifiers. |

## Provider monitoring in 1.5

Connect Qwen Code, Kimi Code, CodeBuddy Code, Qoder, CC Switch, Claude Code, Gemini CLI or your own API usage file. Qoder Quest sessions are read from the local IDE agent logs on Windows; context snapshots are labeled as token estimates, while native Credits stay separate. Qoder stream capture keeps native Credits separate from API-equivalent USD and skips cumulative result events, so the same request is never charged twice. Domestic model families are attributed to Alibaba Cloud, Moonshot AI, Zhipu AI, MiniMax and DeepSeek through the same provider → model chart. Recorded estimates and source-reported amounts stay distinct from actual invoices. Installed tools in standard folders are detected automatically and can be connected together; custom locations remain available. [Source setup and cost definitions](docs/PROVIDER-MONITORING.md).

The provider and model charts also show average cost per 1M tokens for the selected period. The denominator includes only priced tokens; unpriced usage remains visible and is excluded from the average. Multi-provider views combine connected sources with exact duplicate suppression and flag possible overlaps instead of silently adding ambiguous records.

In the Tauri 3.x host, native collection currently supports CodeBuddy Code and Qoder only. The other connectors listed above remain available in the Electron monitoring host, not in the Tauri build.

The Windows Tauri app also supports opt-in multi-device snapshots through Cloudflare R2. Create a dedicated R2 bucket in the app or enter an existing one; Sublens stores one JSON file per device under a bucket prefix (R2's virtual folder). The access key is stored in Windows Credential Manager. Snapshots include only hashed record/session identifiers, time, model, token categories and available cost metadata. They exclude source logs, chat text, project paths, API keys and login credentials. Synchronization runs on launch and every five minutes while the app remains open. R2 uses the account endpoint and `auto` region, and implements prefix-based `ListObjectsV2` for device discovery ([Cloudflare R2 S3 compatibility](https://developers.cloudflare.com/r2/api/s3/api/)).

### Codex provider routing in the 3.0 generation

In 3.0.0, the **Route** page opens the original CC Switch provider manager bundled in the same executable. Create and edit providers, configure advanced options and model mappings, authorize an OpenAI Official account separately through CC Switch, test connections and switch routes there. Provider credentials, model catalogs, takeover, recovery, local proxy, rollback and Responses/Chat conversion use the original CC Switch UI, commands and database. No separate CC Switch installation is required. Codex GUI and CLI remain the task interface. An already running Codex conversation may retain its previous model and authorization context; start a new conversation after switching providers.

The Codex overview estimates remaining time from successful quota observations saved locally. Estimates appear after at least three observations spanning 15 minutes, and remain separated by account, quota window and reset. The app refreshes while open; forecasts are estimates, not guarantees. The overview can also recommend a model mix from recent model usage and quota pace. Because OpenAI does not publish an exact subscription-quota weight for each model, recommendations use API-equivalent intensity.

### CC Switch attribution

The 3.0 routing feature embeds the original provider-manager renderer and selected runtime components from [CC Switch](https://github.com/farion1231/cc-switch), pinned to commit `06082e189d65e6d6dbadc35dacdac1ce6c79d89a`. The embedded provider UI, OAuth, proxy, takeover, recovery and protocol-conversion runtime are derived from CC Switch and remain covered by its MIT license. Copyright © 2025 Jason Young. See [third-party notices](THIRD-PARTY-NOTICES.md) for the full attribution and license boundary.

![Subscription Lens provider overview in English](docs/images/providers.en-US.png)

*Overview with synthetic data; no real account or conversation data is shown.*

## Download and get started

**3.1.1 · Windows x64.** Fixes the overview distribution chart in multi-device view. Stable release with Codex quota forecasts, CodeBuddy and Qoder usage collection, and optional Cloudflare R2 multi-device statistics. API-equivalent cost is an estimate, not a bill or guaranteed savings; records without a matching price remain unpriced. The installer is unsigned and has no automatic updater.

[Download 3.1.1 for Windows](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.1.1) · [macOS Apple Silicon preview](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.0.0-beta.2)

For installation, use `Subscription-Lens-3.1.1-installer-x64.exe`. Close Subscription Lens before running it. Back up existing app data before upgrading from Electron and install into a separate directory if you want an easy rollback. The installer includes third-party license notices and does not require a separate CC Switch installation.

1. Select **Start monitoring** to read the default Codex folder, or **Choose folder** for a custom folder containing `sessions` or `archived_sessions`.
2. Open **Connections → Connect account** to query limits through your locally installed Codex. If signed out, use **Sign in to ChatGPT**.
3. Under **Settings**, enter your billing dates, plan payment and extra credit payments in USD. The end date is exclusive. Choose manual dates or automatic monthly renewal.
4. Choose **Language**: system default, Simplified Chinese, English or Dutch, then **Save**. The choice takes effect immediately and is preserved after restart. Other system languages default to English.

The main workspace is designed for windows from 760×560 upward. The Codex first view combines plan status, billing comparison and provider/model distribution. Medium windows place trends and projects in tabs; tall windows reveal them automatically without changing the current source or period.

No API key, Node.js, Python or Docker is needed for local usage monitoring. Third-party routing requires credentials from the chosen provider. Account queries require an installed Codex executable; local usage monitoring works without an account connection.

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

The app reads Codex records without changing them. It stores usage metadata, including project names, but not chat bodies. The monitoring connection uses Codex authentication. The embedded CC Switch manager separately stores provider credentials and OpenAI Official authorization added for routing; it does not ask for ChatGPT cookies.

Monitoring data is saved in `%APPDATA%\Subscription Lens`; the embedded CC Switch runtime also maintains its own local provider database. Uninstalling retains user data by default. Do not share a live database between devices.

The bundled prices are the **2026-09-16 Standard USD snapshot**. These rates are applied to collected history, not historical prices at each event's time. Fast/Batch, regional surcharges and tool fees are not included. Unknown models or incomplete pricing remain unpriced. Updating the catalog recalculates existing records.

API-equivalent cost is an estimate, not a bill or guaranteed savings. Enter your actual payment to compare. Incomplete collection can understate the total value.

Local records and account summaries are shown separately, never added together. Regular ChatGPT chats and cloud task details are not collected. Multi-device totals include only opt-in Sublens snapshots and may lag by up to five minutes while the app is open. Historical local records are not automatically attributed to the currently connected account; select only your own folders on shared computers.

## Current scope and roadmap

Supports Codex subscriptions and selected local multi-provider records on Windows, with a separate Apple Silicon macOS preview. Regular ChatGPT conversations and other-device usage are not collected automatically. Full Codex feature parity with CodexBar and codex-usage is not complete.

Version 1.4 adds read-only Qwen Code, Kimi Code and CodeBuddy Code connectors, plus GLM, Qwen, Kimi, MiniMax and DeepSeek attribution through Claude Code, CC Switch or compatible gateways. Legacy formats, quota/credit interfaces and more domestic tools remain on the [acceptance roadmap](docs/DOMESTIC-COMPATIBILITY.md).

[Roadmap](ROADMAP.md) · [Coverage checklist](docs/COMPATIBILITY.md) · [Release boundaries](docs/RELEASE.md) · [Validation](docs/VALIDATION.md)

## Build and contribute

For the Windows 3.1.1 build, use Windows x64, Node.js 24, Rust and pnpm. Initialize the pinned CC Switch submodule, then run the Tauri build script: it applies the checked-in Subscription Lens host patches, builds the original CC Switch React renderer and compiles its Rust runtime into one app. The NSIS package includes upstream notices. The Electron `npm run dist` command remains for the macOS preview. See [CONTRIBUTING.md](CONTRIBUTING.md) for validation details. The real-account smoke test is manual-only.

```powershell
npm ci
npm test
git submodule update --init --recursive
cd native/cc-switch-runtime
pnpm install --frozen-lockfile
cd ../..
.\scripts\build-tauri-migration-host.ps1 -Action check
.\scripts\build-tauri-migration-host.ps1 -Action release
```

## Development and acknowledgements

Developed with assistance from **GPT-6 Astra**.

[CodexBar](https://github.com/steipete/CodexBar) informs the quota and desktop interaction requirements. MIT-licensed [codex-usage](https://github.com/zJay26/codex-usage) source is retained with its notices for future accounting-engine integration.

MIT. See [third-party notices](THIRD-PARTY-NOTICES.md) for attribution and licenses. This is an independent project, not affiliated with OpenAI or endorsed by the referenced projects.
