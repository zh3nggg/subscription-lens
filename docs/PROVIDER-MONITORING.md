# Provider monitoring · 1.3.0 beta

Use **Connections → Providers → Add source**, then open **Overview → Providers**.
The app reads the selected local source every 15 seconds while running. No cloud account or API key is required for these connectors.

| Source | Select | Collected information |
| --- | --- | --- |
| CC Switch | Its SQLite database, usually `~/.cc-switch/cc-switch.db` | Recorded requests, provider/model, tokens, estimated costs, HTTP status, latency and first-token latency when present. Proxy logging must already be enabled in CC Switch. |
| Claude Code | `~/.claude/projects` | Assistant usage records; repeated message chunks update the same record. |
| Gemini CLI | `~/.gemini/tmp` | Gemini messages in session JSON files, including cached and thinking tokens when available. |
| API usage file | A JSONL file in the schema below | Explicit usage and optional USD cost/performance data exported by your own client or gateway. |

Paths are chosen explicitly through the desktop file picker. CC Switch is opened read-only. Provider configuration and credentials are not selected from its database. Local session files are parsed, but conversation bodies are not copied into the app's ledger. Project/session identifiers remain local metadata.

## Charts and records

- Overview starts with provider shares. Select a sector or its legend row to see individual models, then select a model to open its records.
- Switch between tokens and cost without leaving the selected provider. The breadcrumb returns to all providers.
- The ring includes only known amounts. Unpriced records are listed separately; an entirely unpriced total is shown as unavailable.
- Tokens include cache subsets only once. Reasoning tokens, where supplied, are included in output rather than added twice.
- Overview tabs, responsive record pagination and paginated legends keep common screens within the window. Settings and deliberately expanded long details may scroll.
- The selected source defines the ledger. Different sources are **not added together**, because CC Switch and local CLI logs can describe the same requests.

## Cost meanings

**Estimated** means a local pricing calculation, including CC Switch's stored calculation and its multiplier. **Source-reported** means the importing client explicitly labeled the amount as reported. It does not establish that a provider has settled or invoiced it. This beta does not query provider billing dashboards or balances.

Claude/Gemini records without prices remain unpriced until you add a provider/model rule under **Prices → Providers**. Rules are exact matches and USD per million tokens. Source-provided amounts are preserved. The bundled OpenAI catalog is used only for exact OpenAI model matches with complete counters; the existing pricing snapshot limitations still apply.

Missing status/latency is unavailable, not a successful or zero-latency request. Success rate uses only records with a supplied status (HTTP 200–399). Latency metrics use only records that supply latency.

## JSONL schema

Each complete newline-terminated line contains one request. Reuse `id` to correct a record rather than duplicating it. The source file can be appended while the app runs.

```json
{"schema":"subscription-lens.usage.v1","id":"request-1","at":"2026-09-16T10:00:00Z","provider":"My provider","model":"my-model","usage":{"input":1200,"cached":200,"write":0,"output":100,"reasoning":0},"cost":{"usd":"0.0042","basis":"estimate"},"currency":"USD","status":200,"latencyMs":830,"ttftMs":150}
```

`input` includes cache reads and writes; `output` includes reasoning. Cache and reasoning categories are optional and default to zero. The `cost`, `status`, latency, `session` and `project` fields are optional. Use `basis: "reported"` only when the exporting source supplies that amount. Non-USD costs are rejected rather than silently converted. Counters must be nonnegative safe integers.

Unknown or malformed records do not become zero usage. The source footer reports skipped records from the latest scan. A paused source keeps its imported history. This beta supports one-device ledgers and does not provide a proxy, route requests, switch client credentials, or guarantee complete CC Switch feature parity.

## Local release retention

Keep the latest verified stable package and latest verified preview package. Verify checksums and tests before replacing either slot. Never call a preview stable to fill an empty slot. Until the first stable release, keep the preceding preview as a rollback copy. Source code and app data are outside package cleanup.
