# Subscription Lens 1.4.0-beta.2

Windows x64 · 中文 / English / Nederlands

## 新增功能

- 主窗口改为紧凑工作台：窄侧栏、低顶栏与单行操作区，把常用信息集中在 760×560 起的窗口内。
- Codex 默认先显示套餐与账期；多供应商默认先显示用量分布。额度、分布、趋势、项目与性能共享同一内容区域，切换时不改变筛选条件。
- 导航始终保留图标和短标签；窗口放大后也维持紧凑密度，减少无效留白和视线移动。
- 国产编码平台只读连接器：Qwen Code 月度请求记录、Kimi Code 主／子代理 per-turn 用量、CodeBuddy Code 项目记录。
- GLM、通义、Kimi、MiniMax、DeepSeek 的供应商归属，适用于 Claude Code、CC Switch 与兼容入口。
- CodeBuddy 缓存命中／未命中优先解析，并修正其回退记录中输入已包含缓存的特殊口径。
- 保留原有 CC Switch、Claude Code、Gemini CLI 与 API JSONL 连接器。
- 供应商 → 模型环形图，可切换 Tokens／费用，点击模型进入请求明细。
- 请求成功率、P95 延迟、首 Token 延迟、未计价筛选、自定义价格及 CSV。
- 常用页面采用页内标签与自适应分页，避免依赖整页上下滚动；设置和主动展开的复杂内容例外。
- 新安装包沿用原安装身份与目录，原位替换旧版并保留设置和用量；无需手动卸载。稳定版与测试版共用一个安装。

## What's new

A compact desktop workspace now fits the full daily workflow at 760×560. Codex opens on plan status, while multi-provider monitoring opens on provider distribution; quota, distribution, trends, projects and performance share one tabbed workspace. Read-only Qwen Code, Kimi Code and CodeBuddy Code connectors and domestic provider attribution remain integrated. Run the installer over the existing installation to retain local settings and history.

## Nieuw

De compacte werkruimte bevat de dagelijkse taken vanaf 760×560. Codex opent met de abonnementsstatus; monitoring van meerdere aanbieders opent met de verdeling per aanbieder. Limieten, verdeling, trends, projecten en prestaties delen één gebied met tabbladen. De bestaande connectors en aanbiederherkenning blijven geïntegreerd. Het installatieprogramma vervangt de bestaande app en behoudt instellingen en geschiedenis.

## Scope

- Local sources are optional and read-only. Select one source at a time to avoid double-counting overlapping CLI/proxy records.
- CC Switch amounts are stored estimates. Source-reported amounts are not independently verified invoices. Direct billing APIs, provider balances, proxy routing and credential switching are not included.
- The existing Codex collector still has incomplete support for modern request/compaction counters and fork histories. The vendored codex-usage engine remains experimental and inactive. This release does not claim full CodexBar, codex-usage or CC Switch parity.
- Unsigned Windows build. In-place installer upgrades are supported by the packaging configuration; a clean-VM upgrade has not been certified. No background automatic downloading is included. Portable ZIP files must be extracted manually.
- Keep the latest verified stable and preview locally. Until a stable release exists, the previous preview is retained as the rollback copy.

See [source setup](https://github.com/zh3nggg/subscription-lens/blob/main/docs/PROVIDER-MONITORING.md), [validation](https://github.com/zh3nggg/subscription-lens/blob/main/docs/VALIDATION.md) and [third-party notices](https://github.com/zh3nggg/subscription-lens/blob/main/THIRD-PARTY-NOTICES.md).

Developed with assistance from **GPT-6 Astra**. CodexBar and CC Switch are references; MIT-licensed codex-usage source is retained with its notices.
