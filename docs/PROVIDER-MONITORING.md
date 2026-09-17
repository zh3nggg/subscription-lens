# Provider monitoring · 1.5.2 stable

Open **Connections → Providers**. Tools installed in standard folders are detected locally; connect one or all in a click. Use **Add manually** only for custom locations, then open **Overview → Providers**.
The app reads the selected local source every 15 seconds while running. No cloud account or API key is required for these connectors.

| Source | Select | Collected information |
| --- | --- | --- |
| CC Switch | Its SQLite database, usually `~/.cc-switch/cc-switch.db` | Recorded requests, provider/model, tokens, estimated costs, HTTP status, latency and first-token latency when present. Proxy logging must already be enabled in CC Switch. |
| Claude Code | `~/.claude/projects` | Assistant usage records; repeated message chunks update the same record. |
| Gemini CLI | `~/.gemini/tmp` | Gemini messages in session JSON files, including cached and thinking tokens when available. |
| Qwen Code | Its Qwen data folder, normally `~/.qwen` or `QWEN_HOME` | Per-request records from `usage/token-usage-YYYY-MM.jsonl`, including model, input/output/cache/thinking tokens and API duration. |
| Kimi Code | `KIMI_CODE_HOME`, normally `~/.kimi-code` | Per-turn `usage.record` events from main and subagent `wire.jsonl` files. Session-level cumulative rows are skipped. |
| CodeBuddy Code | `~/.codebuddy` or its `projects` folder | Usage-bearing assistant/tool-call rows. Cache hit/miss fields are preferred; the inclusive fallback subtracts cache reads before showing ordinary input. |
| Qoder | `~/.qoder` (or `QODER_CONFIG_DIR`) plus `%APPDATA%/Qoder/logs` on Windows | Assistant usage events from Qoder stream JSON. Qoder Quest IDE sessions are read from local `agent.log` context snapshots when available. Snapshot Tokens are explicitly estimates; native Credits remain separate. Cumulative `result` events are skipped to prevent double counting. |
| API usage file | A JSONL file in the schema below | Explicit usage and optional USD cost/performance data exported by your own client or gateway. |

Automatic discovery checks only the standard paths listed above and the Qwen/Kimi environment overrides. It does not read credentials or client configuration. Custom paths are chosen explicitly through the desktop file picker. CC Switch is opened read-only. Provider configuration and credentials are not selected from its database. Local session files are parsed, but conversation bodies are not copied into the app's ledger. Project/session identifiers remain local metadata.

## Charts and records

- Overview starts with provider shares. Select a sector or its legend row to see individual models, then select a model to open its records.
- Switch between tokens and cost without leaving the selected provider. The breadcrumb returns to all providers.
- The ring includes only known amounts. Unpriced records are listed separately; an entirely unpriced total is shown as unavailable.
- Tokens include cache subsets only once. Reasoning tokens, where supplied, are included in output rather than added twice.
- Overview tabs, responsive record pagination and paginated legends keep common screens within the window. Settings and deliberately expanded long details may scroll.
- The all-source view combines connected sources into one ledger and suppresses exact duplicate requests. Possible overlaps remain visible with source provenance because CC Switch and local CLI logs can describe the same request. Selecting one source still limits the ledger to that source.
- When the selected source has records matching another connected source, the activity view marks exact request-ID matches and possible overlaps (same provider/model/token shape within a short time bucket). These are warnings, not automatic deletions; inspect the source boundary before comparing totals.
- CSV exports include anonymous source IDs, overlap type and overlapping source IDs so duplicate-billing reviews can be continued outside the app. Local paths, credentials and chat content are not exported.

### Qoder capture

Qoder's `/usage` screen is account-level. Subscription Lens reads only local usage events and IDE agent logs; it never reads Qoder credentials or calls the account billing endpoint. Quest sessions expose cumulative `usedTokens` context snapshots rather than billable input/output fields. Subscription Lens keeps the latest snapshot per session, labels it as an estimate, and never sums repeated snapshots. For CLI usage, run a task through the bundled helper to produce an append-only stream that the Qoder connector can monitor:

```powershell
pwsh -File scripts/qoder-usage-capture.ps1 -p "your prompt"
```

The helper writes `~/.qoder/usage/subscription-lens.jsonl`. Add the discovered **Qoder** folder under **Connections → Providers**. On Windows, the same connection also checks `%APPDATA%\Qoder\logs` for Quest agent logs. Qoder Credits remain in their native unit, while API-equivalent USD is shown only when a separate pricing rule is available; the two values are never summed.

## Cost meanings

**Estimated** means a local pricing calculation, including CC Switch's stored calculation and its multiplier. **Source-reported** means the importing client explicitly labeled the amount as reported. It does not establish that a provider has settled or invoiced it. This release does not query provider billing dashboards or balances.

CLI records without prices remain unpriced until you add a provider/model rule under **Prices → Providers**. Rules are exact matches and USD per million tokens. Source-provided amounts are preserved. The bundled OpenAI catalog is used only for exact OpenAI model matches with complete counters; the existing pricing snapshot limitations still apply.

Missing status/latency is unavailable, not a successful or zero-latency request. Success rate uses only records with a supplied status (HTTP 200–399). Latency metrics use only records that supply latency.

## JSONL schema

Each complete newline-terminated line contains one request. Reuse `id` to correct a record rather than duplicating it. The source file can be appended while the app runs.

```json
{"schema":"subscription-lens.usage.v1","id":"request-1","at":"2026-09-16T10:00:00Z","provider":"My provider","model":"my-model","usage":{"input":1200,"cached":200,"write":0,"output":100,"reasoning":0},"cost":{"usd":"0.0042","basis":"estimate"},"currency":"USD","status":200,"latencyMs":830,"ttftMs":150}
```

`input` includes cache reads and writes; `output` includes reasoning. Cache and reasoning categories are optional and default to zero. The `cost`, `status`, latency, `session` and `project` fields are optional. Use `basis: "reported"` only when the exporting source supplies that amount. Non-USD costs are rejected rather than silently converted. Counters must be nonnegative safe integers.

Unknown or malformed records do not become zero usage. The source footer reports skipped records from the latest scan. A paused source keeps its imported history. This release supports one-device ledgers and does not provide a proxy, route requests, switch client credentials, or guarantee complete CC Switch feature parity.

## Local release retention

Keep the latest verified stable package and latest verified preview package. Verify checksums and tests before replacing either slot. Never call a preview stable to fill an empty slot. Until the first stable release, keep the preceding preview as a rollback copy. Source code and app data are outside package cleanup.
