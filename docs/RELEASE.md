# Subscription Lens 1.2.0 — Preview

Windows x64 desktop monitor for Codex subscriptions. Chinese, English and Dutch UI. Download the `.exe` installer or extract the portable `.zip`; no API key or development tools required. Use `SHA256SUMS.txt` to verify downloads.

## Included

- Account quota and reset countdowns, conditional recent-pace estimates, optional low-quota alerts and quiet hours.
- Compact pinnable window, tray operation, light/dark themes and keyboard navigation.
- Local project/session/record analysis, pricing coverage, CSV export and billing-cycle comparisons.
- Automatic monthly billing dates and local aggregate-only HTML reports.

## Preview boundaries

- Full Codex feature parity with CodexBar and codex-usage is not complete. The vendored codex-usage engine has passed component tests but is **not active in this desktop binary**.
- The active collector handles legacy `token_count` records. Modern independent request/compaction records, mixed counter resets and inherited fork histories are not fully reconciled; displayed totals may undercount or overcount. Do not use them as an authoritative bill.
- Pricing uses a dated Standard-rate USD snapshot. Fast multipliers and API Fast/Batch pricing are not applied. Unknown prices stay unpriced.
- Ordinary ChatGPT conversations, other devices and non-OpenAI providers are not collected automatically.
- Unsigned Windows build; no automatic updater. Clean-machine installer/uninstaller behavior and actual Windows toast appearance have not been independently verified.

See [README](https://github.com/zh3nggg/subscription-lens#readme), [validation](https://github.com/zh3nggg/subscription-lens/blob/main/docs/VALIDATION.md), [roadmap](https://github.com/zh3nggg/subscription-lens/blob/main/ROADMAP.md) and [third-party notices](https://github.com/zh3nggg/subscription-lens/blob/main/THIRD-PARTY-NOTICES.md). CodexBar is a product reference; codex-usage's MIT source and attribution are included in the repository. Neither project endorses this app.

## 下一版前瞻 / Next update / Volgende update

优先完成 Codex 统计引擎接入及安全迁移。Claude、Cursor、Gemini 等其他供应商支持已列入下一版展望，当前不包含，交付日期未定。

Complete Codex accounting-engine integration and safe migration first. Other providers, including Claude, Cursor and Gemini, are on the roadmap; they are not currently supported and have no committed delivery date.

Eerst de Codex-engine en veilige migratie afronden. Andere aanbieders, waaronder Claude, Cursor en Gemini, staan op de roadmap; ze worden nog niet ondersteund en hebben geen toegezegde datum.
