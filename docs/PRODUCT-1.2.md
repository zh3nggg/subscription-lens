# 1.2 product decisions

Research date: 2026-09-16. Scope: a Windows desktop companion for individual Codex subscription users.

## Competitive baseline

- [CodexBar](https://github.com/steipete/CodexBar) already offers provider limits, reset countdowns, local cost scans, notifications and broad provider support. Matching an isolated meter is not differentiation.
- [codex-usage](https://github.com/zJay26/codex-usage) offers local project/session analytics and pricing coverage. Its README distinguishes local usage from account quotas.
- [ccusage](https://github.com/ccusage/ccusage) offers daily/monthly/session CLI reports and filters.

These are documentation comparisons, not a hands-on performance benchmark or a claim of overall superiority. The desktop 1.2.0 runtime uses its original collector. The source repository now vendors codex-usage packages for a future integration; see THIRD-PARTY-NOTICES.md.

## Chosen workflow

1. Before working: see current account capacity, time until reset and a conservative recent-pace estimate when evidence exists.
2. While working: use a compact, optionally pinned window; opt into low-quota notifications instead of constantly opening a dashboard.
3. After working: find the expensive project/session, drill down to its records, and understand its share and pricing completeness.
4. At renewal: see the actual current billing window, priced usage versus payment and remaining break-even amount without editing dates every month.
5. When data is incomplete: see the exact coverage problem and an action to resolve it. A stale quota is never reported as live.

## Boundaries

- Keep the existing five navigation destinations; progressive disclosure for diagnostics and record-level details.
- No new runtime dependencies, cloud backend, extra account system, model requests, non-OpenAI providers in the current release, chat history analysis or background telemetry.
- Quota forecasts use official same-account, same-limit, same-reset observations only. Never derive remaining subscription quota from local token counts. Predictions are conditional extrapolations, not guarantees.
- Monthly renewal is opt-in for existing users, with explicit anchor day and clamping for short months. One-off extra payments do not silently recur.
- Sharing exports an aggregate-only local HTML report after preview. No project names, paths, session IDs, account identity or conversation text.
- Retain Chinese, English and Dutch across all new flows.
- Do not add an updater tied to a guessed GitHub repository. Signing and public release remain separate distribution work.

## Acceptance

Test reset boundaries, stale and sparse observations, threshold deduplication, quiet hours, month-end renewal, partial pricing, exact session filtering, source removal, report privacy, old-data migration, UI keyboard/compact flows, all three languages and packaged execution. Measure local query performance with a synthetic 10,000-event ledger. Report actual measurements without implying a cross-tool benchmark.
