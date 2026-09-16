# Subscription Lens

A Windows desktop app for **Codex subscription users** who want to see their remaining quota, understand which projects use their tokens, and compare recorded usage at API rates with their subscription payment. No API key is required.

[English](README.md) · [简体中文](docs/README.zh-CN.md) · [Nederlands](docs/README.nl.md)

## What you can do

| Task | Features |
| --- | --- |
| Check remaining capacity | Account quota, reset countdowns and recent-pace estimates when enough observations are available. |
| Understand your usage | Compare providers in a ring chart, select one to inspect its models, then drill down to requests or Codex sessions. |
| Compare usage with your payment | View estimated API-equivalent costs alongside your actual payment for the billing period. |
| Keep limits within reach | Use a compact pinnable window, the system tray and optional low-quota alerts with quiet hours. |
| Export and share | Export records to CSV or save an aggregate-only HTML report without project names or account identifiers. |

## Provider monitoring in 1.4

Connect Qwen Code, Kimi Code, CodeBuddy Code, CC Switch, Claude Code, Gemini CLI or your own API usage file. Domestic model families are attributed to Alibaba Cloud, Moonshot AI, Zhipu AI, MiniMax and DeepSeek through the same provider → model chart. Recorded estimates and source-reported amounts stay distinct from actual invoices. Installed tools in standard folders are detected automatically and can be connected together; custom locations remain available. [Source setup and cost definitions](docs/PROVIDER-MONITORING.md).

The Codex overview can recommend a model mix from the last 14 days of model usage and the current quota pace. It targets the next reset and shows its confidence. Because OpenAI does not publish an exact subscription-quota weight for each model, this is an adaptive recommendation based on API-equivalent intensity, not a guarantee.

![Subscription Lens provider overview in English](docs/images/providers.en-US.png)

*Overview with synthetic data; no real account or conversation data is shown.*

## Download and get started

**1.4.0-beta.4 Preview · Windows x64.** The current collector does not yet handle all client record formats; totals may be too high or too low. Costs are estimates, not a bill or guaranteed savings. The build is unsigned and has no automatic updater.

[Download the installer or portable ZIP](https://github.com/zh3nggg/subscription-lens/releases/tag/v1.4.0-beta.4)

Run the new installer to upgrade the existing installation in place; keep its detected folder. Settings and usage history are retained. Stable and preview installers share one application identity; the portable ZIP is not an installer. Background automatic downloading is not included.

1. Select **Start monitoring** to read the default Codex folder, or **Choose folder** for a custom folder containing `sessions` or `archived_sessions`.
2. Open **Connections → Connect account** to query limits through your locally installed Codex. If signed out, use **Sign in to ChatGPT**.
3. Under **Settings**, enter your billing dates, plan payment and extra credit payments in USD. The end date is exclusive. Choose manual dates or automatic monthly renewal.
4. Choose **Language**: system default, Simplified Chinese, English or Dutch, then **Save**. The choice takes effect immediately and is preserved after restart. Other system languages default to English.

The main workspace is designed for windows from 760×560 upward. The Codex first view combines plan status, billing comparison and provider/model distribution. Medium windows place trends and projects in tabs; tall windows reveal them automatically without changing the current source or period.

No API key, Node.js, Python or Docker is needed to run the app. Account queries require an installed Codex executable; local usage monitoring works without an account connection.

<details>
<summary>Usage details and shortcuts</summary>

- **Know when to slow down.** The overview prioritizes account capacity and reset time. Recent-pace estimates require at least three observations, 15 minutes and a measurable change in the same account/window/reset. They use up to two hours of observations, never local token-to-quota guesses. Stale data (over three minutes), resets and counter corrections suppress unreliable estimates. Forecasts assume your recent pace continues; they are not guarantees.
- **Stay in your work.** Open Compact view with Ctrl+Shift+M; optionally pin it above other windows. Escape restores the dashboard. A tray click opens this view when tray mode is enabled.
- **Get quiet alerts.** Opt into alerts at 20% and 5% remaining and observed quota recovery. Alerts are deduplicated per window and account. Quiet hours default to 22:00–08:00 local time. The app must remain running; Windows notification settings can suppress delivery.
- **Find expensive work.** Select a project or chart date, sort sessions by cost or recency, then inspect the exact records. Ctrl+K opens search. Session totals count each record once; subagent rows show their own usage, not an inclusive parent total.
- **Keep billing current.** Choose Monthly renewal and your renewal day. Short months clamp to their last day without changing the anchor. Plan payment repeats; extra payments apply only to the current cycle. Existing installations keep manual dates until you change the mode.
- **Check the evidence.** Data health shows unpriced reasons, parsing issues and price snapshot date, with direct links to affected records and sources. Pricing coverage does not prove complete account history. Previous-period comparisons use the immediately preceding interval of equal elapsed length, not a calendar-month forecast.
- **Share without revealing projects.** Preview and export a self-contained HTML summary. It includes totals, pricing coverage and date range, but no account identity, project names, paths or session IDs. Nothing is uploaded automatically.

Quota observations are stored locally for up to three days, capped at 25,000 rows. No new runtime dependencies, cloud service or model calls were added for these features.

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

Use Windows x64 and Node.js 24. Dependencies are pinned in package-lock.json. See [CONTRIBUTING.md](CONTRIBUTING.md) for synthetic UI tests, translation changes and the experimental native engine. The real-account smoke test is manual-only.

```powershell
npm ci
npm test
npm start
npm run dist
```

## Development and acknowledgements

Developed with assistance from **GPT-6 Astra**.

[CodexBar](https://github.com/steipete/CodexBar) informs the quota and desktop interaction requirements. MIT-licensed [codex-usage](https://github.com/zJay26/codex-usage) source is included for the next accounting-engine integration; it is not active in the 1.4.0-beta.4 desktop app.

MIT. See [third-party notices](THIRD-PARTY-NOTICES.md) for attribution and licenses. This is an independent project, not affiliated with OpenAI or endorsed by the referenced projects.
