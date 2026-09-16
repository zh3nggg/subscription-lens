# Subscription Lens 1.3.0-beta.1

Windows x64 · 中文 / English / Nederlands

## 新增功能

- 多供应商本地监控：CC Switch 请求数据库、Claude Code、Gemini CLI 与 API JSONL。
- 供应商 → 模型环形图，可切换 Tokens／费用，点击模型进入请求明细。
- 请求成功率、P95 延迟、首 Token 延迟、未计价筛选、自定义价格及 CSV。
- 常用页面采用页内标签与自适应分页，避免依赖整页上下滚动；设置和主动展开的复杂内容例外。
- 新安装包沿用原安装身份与目录，原位替换旧版并保留设置和用量；无需手动卸载。稳定版与测试版共用一个安装。

## What's new

Local provider connectors, provider-to-model ring charts, Tokens/cost switching, request and performance analysis, custom pricing and CSV export. Common screens use tabs and pagination. Run the new installer to replace the old application while retaining local settings and history; keep the detected installation directory.

## Nieuw

Lokale bronnen voor meerdere aanbieders, ringdiagrammen van aanbieder naar model, wisselen tussen tokens en kosten, verzoek- en prestatieanalyse, eigen prijzen en CSV. Veelgebruikte schermen gebruiken tabbladen en paginering. Het nieuwe installatieprogramma vervangt de oude app en behoudt instellingen en geschiedenis; behoud de gevonden installatiemap.

## Scope

- Local sources are optional and read-only. Select one source at a time to avoid double-counting overlapping CLI/proxy records.
- CC Switch amounts are stored estimates. Source-reported amounts are not independently verified invoices. Direct billing APIs, provider balances, proxy routing and credential switching are not included.
- The existing Codex collector still has incomplete support for modern request/compaction counters and fork histories. The vendored codex-usage engine remains experimental and inactive. This release does not claim full CodexBar, codex-usage or CC Switch parity.
- Unsigned Windows build. In-place installer upgrades are supported by the packaging configuration; a clean-VM upgrade has not been certified. No background automatic downloading is included. Portable ZIP files must be extracted manually.
- Keep the latest verified stable and preview locally. Until a stable release exists, the previous preview is retained as the rollback copy.

See [source setup](https://github.com/zh3nggg/subscription-lens/blob/main/docs/PROVIDER-MONITORING.md), [validation](https://github.com/zh3nggg/subscription-lens/blob/main/docs/VALIDATION.md) and [third-party notices](https://github.com/zh3nggg/subscription-lens/blob/main/THIRD-PARTY-NOTICES.md).

Developed with assistance from **GPT-6 Astra**. CodexBar and CC Switch are references; MIT-licensed codex-usage source is retained with its notices.
