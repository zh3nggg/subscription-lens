# codex-usage statistics engine

Source: https://github.com/zJay26/codex-usage

Pinned commit: `733df6216a0427d43a343a9210539be91b90e5bb` (version 2.6.4).

License: MIT. Copyright (c) 2026 Codex Usage contributors. Full license in LICENSE.

Copied packages: internal/model, store, usage, timezone, pricing, with upstream regression tests and fixtures. The Go timezone license is retained in internal/timezone/GO-LICENSE. Dependency versions are pinned by go.mod/go.sum.

Subscription Lens adds cmd/lens-engine, a stdin/stdout adapter. It accepts only explicitly supplied source roots, starts no web server, does not install a service or updater, and exports structured usage metadata without thread titles. The scanner and store are initially copied unchanged. This adapter is under evaluation; copying it does not establish UI feature parity.

Do not distribute a native binary without the transitive dependency license notices. Rebuild against this pinned source and test before enabling it for production accounts.

## Verification on 2026-09-16

- Go 1.27.1, Windows amd64: upstream usage, store and pricing tests passed; model and timezone packages compiled (no package tests).
- Adapter compiled with `-trimpath`.
- `scripts/check-native-engine.cjs` passed with synthetic records: ordinary and compaction request accounting, suppression of legacy mirror events, explicit Fast attribution, copied-file deduplication, restart persistence and metadata-only output.
- The native adapter is not enabled in the desktop app yet. No real ledger was migrated, no installer was replaced, and no parity claim is made.
