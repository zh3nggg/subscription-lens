# Subscription Lens 1.5.0-beta.1

Windows x64 preview release.

## Highlights

- Automatic discovery is now the primary path for Qoder, CodeBuddy Code, Qwen Code, Kimi Code, CC Switch, Claude Code and Gemini CLI. Custom folders and JSONL files remain under advanced manual setup.
- Added a compatibility panel for domestic agents: Qoder and CodeBuddy are supported, DeepSeek is supported through imports and gateways, while TRAE and Cursor remain candidates until a stable local usage format is available.
- Added cross-source overlap detection with exact/possible labels, source names, filters and anonymous provenance in CSV exports.
- The selected provider source remains the accounting ledger; connected sources are never silently added together.
- Added three-language copy for the new onboarding and audit controls.

## Scope

This preview continues to show local usage, source-reported amounts and API-equivalent estimates as separate evidence types. It does not read credentials, chat content or web-only account history. TRAE and Cursor are not claimed as automatic local connectors yet.

## Upgrade

Run `Subscription-Lens-1.5.0-beta.1-x64.exe` over an existing installation. The installer keeps the existing installation identity and local data directory.
