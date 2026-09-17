# Subscription Lens 1.4.6

Windows x64 · 中文 / English / Nederlands

- 额度预测改为使用当前 `limit + window + reset` 对应窗口内的全部历史观测，按窗口平均消耗速度推算，不再限制为最近 120 分钟。
- 模型组合建议优先使用当前额度窗口内的模型历史，并在界面中标注窗口平均速度；未提供窗口时长的来源继续回退到既有历史基线。
- 额度观测在活动窗口结束前持续保留，重置后再保留两天，以支持完整窗口统计。

## What's new

- Quota forecasts now use every retained observation for the active `limit + window + reset` window and calculate its average pace instead of limiting the sample to the last 120 minutes.
- Model-mix advice prioritizes model history from the active quota window and labels the window-average pace; sources without a window duration keep the existing history fallback.
- Quota observations remain available until the active window ends and for two days after reset, allowing full-window statistics.

## Nieuw

- Quotavoorspellingen gebruiken nu alle bewaarde metingen van het actieve venster (`limit + window + reset`) en berekenen het gemiddelde tempo in plaats van alleen de laatste 120 minuten.
- Het modelmixadvies gebruikt bij voorkeur modelhistorie uit het actieve quotavenster en benoemt het gemiddelde tempo; bronnen zonder vensterduur gebruiken de bestaande historische terugval.
- Quota-metingen blijven beschikbaar tot het actieve venster eindigt en nog twee dagen na de reset, zodat statistieken over het volledige venster mogelijk zijn.

# Subscription Lens 1.4.5 (previous release)

Windows x64 · 中文 / English / Nederlands

## 新增功能

- 修复点击“多供应商”时因读取错误字段导致界面切换失败的问题。
- 供应商和模型分布图新增平均每百万 Tokens 成本，按所选时间段计算；未计价 Tokens 保留展示但不纳入分母，来源报告费用与本地估算仍分开保存。
- 新增“设备”页面：为本机生成稳定设备身份，历史 Codex 记录自动归属本机；按设备查看 Tokens、API 等价成本、会话和最后同步时间，并可直接进入该设备的用量筛选。
- 支持设备数据包导入／导出。数据包只包含匿名会话标识、时间、模型、Token 分类和 API 等价成本快照，不包含聊天正文、项目路径或登录凭据。
- 账户额度继续作为共享账户数据展示，不把它拆分成虚假的单设备额度。新增术语悬停解释，覆盖额度、缓存、计价、延迟、模型建议和数据范围。
- 自动发现 Qwen Code、Kimi Code、CodeBuddy Code、CC Switch、Claude Code 与 Gemini CLI 的常用本机目录，可一键连接单个或全部已安装工具；特殊路径继续支持手动选择。
- Codex 总览新增模型组合建议：结合近 14 天模型使用比例、API 等价强度和当前额度预测，建议提高或降低各模型比例，使使用速度更接近窗口重置时间。
- 建议显示学习状态和可信度。OpenAI 未提供各模型的套餐额度精确换算权重，因此建议会随额度观测继续校准，不承诺精确耗尽额度。
- 模型建议在小窗口中作为独立标签，在高窗口中与趋势和项目并列，保持总览无整页滚动。
- 保留供应商 → 模型环形图、多来源明细与性能、自定义计价、套餐实付对比、专注窗口和三语言支持。
- 新安装包沿用原安装身份与目录，原位替换旧版并保留设置和用量。
- Windows 任务栏、窗口、托盘和搜索入口统一使用 Subscription Lens 应用标识与镜片图标，避免显示为 Electron。
- 新增 Qoder 只读连接器：扫描 `~/.qoder` 或 `QODER_CONFIG_DIR` 下的 stream JSON；Windows 同时读取 `%APPDATA%\Qoder\logs` 的 Quest `agent.log`。Quest 上下文快照只保留每个会话的最新值并标记为 Tokens 估算，原始 Credits 分开保存；跳过累计 `result` 事件，避免重复计费。
- 修复额度预测在上游时间戳滞后时持续显示“正在积累观测”的问题；同一窗口至少 15 分钟、三条观测后，即使期间没有消耗变化也会明确显示为可持续至重置，回退和重置仍会抑制预测。

## What's new

Provider and model distributions now show average cost per 1M tokens for the selected period. Unpriced tokens remain visible but are excluded from the denominator; source-reported and estimated costs remain separate.

Devices are now a first-class view. Each installation has a stable device identity; local Codex history is assigned to it and can be filtered by device. Anonymous device packages transfer timestamps, model, token categories and API-equivalent cost snapshots without chat content, project paths or credentials. Shared account quota remains separate from device usage.

Standard local installations of six supported tools are now detected and connected in one click. The Codex overview adds a confidence-labelled model-mix recommendation based on 14-day habits, API-equivalent intensity and live quota pace. It targets the next reset but remains adaptive because exact per-model subscription quota weights are not published.

Qoder stream usage can be captured with the bundled PowerShell helper. On Windows, Quest IDE agent logs are also imported automatically. Their cumulative context snapshots are kept once per session and labeled as token estimates; native Credits remain separate from API-equivalent USD, and cumulative result events are ignored to prevent double billing. Quota forecasting now tolerates a delayed upstream observation timestamp while retaining its evidence threshold.

Windows taskbar and window metadata now use the Subscription Lens application identity and icon instead of Electron's default identity.

## Nieuw

De diagrammen per aanbieder en model tonen nu de gemiddelde kosten per 1M tokens voor de geselecteerde periode. Ongeprijsde tokens blijven zichtbaar maar tellen niet mee in de noemer; gerapporteerde en geschatte kosten blijven gescheiden.

Apparaten zijn nu een eigen overzicht. Elke installatie krijgt een stabiele apparaatidentiteit; lokale Codex-geschiedenis wordt eraan gekoppeld en kan per apparaat worden gefilterd. Anonieme apparaatpakketten bevatten tijdstippen, model, tokencategorieën en API-equivalente kostensnapshots, zonder chatinhoud, projectpaden of inloggegevens. Gedeelde accountquota blijft afzonderlijk van apparaatgebruik.

Zes ondersteunde tools in standaardmappen worden nu automatisch gevonden en met één klik verbonden. Het Codex-overzicht adviseert een modelmix op basis van 14 dagen gebruik, API-equivalente intensiteit en het actuele quotatempo, met een zichtbare betrouwbaarheid. Het advies richt zich op de volgende reset en blijft adaptief omdat exacte quotagewichten per model niet zijn gepubliceerd.

Qoder-streamgebruik kan met het meegeleverde PowerShell-script worden vastgelegd. Op Windows worden Quest-agentlogs ook automatisch gelezen. Hun cumulatieve contextsnapshots worden eenmaal per sessie bewaard en als token-schatting gemarkeerd; Credits blijven gescheiden van API-equivalente USD en cumulatieve resultaten worden overgeslagen om dubbele kosten te voorkomen. De quotavoorspelling verdraagt nu vertraagde upstream-tijdstempels en behoudt de drempel voor betrouwbare observaties.

De Windows-taakbalk en venstermetadata gebruiken nu de Subscription Lens-identiteit en het juiste pictogram in plaats van de standaardidentiteit van Electron.

## Scope

- Local sources are optional and read-only. Automatic discovery checks known local paths only and never reads credentials. Select one source at a time in analytics to avoid double-counting overlapping CLI/proxy records.
- Model-mix advice uses observed habits, API-equivalent intensity and quota pace. It is an experiment to calibrate over later windows, not an official quota conversion or guarantee.
- CC Switch amounts are stored estimates. Source-reported amounts are not independently verified invoices. Direct billing APIs, provider balances, proxy routing and credential switching are not included.
- The existing Codex collector still has incomplete support for modern request/compaction counters and fork histories. The vendored codex-usage engine remains experimental and inactive.
- Unsigned Windows build. In-place installer upgrades are supported by the packaging configuration; a clean-VM upgrade has not been certified. No background automatic downloading is included.
- Keep the latest verified stable and preview locally. Until a stable release exists, the previous preview is retained as the rollback copy.

See [source setup](https://github.com/zh3nggg/subscription-lens/blob/main/docs/PROVIDER-MONITORING.md), [validation](https://github.com/zh3nggg/subscription-lens/blob/main/docs/VALIDATION.md) and [third-party notices](https://github.com/zh3nggg/subscription-lens/blob/main/THIRD-PARTY-NOTICES.md).

Developed with assistance from **GPT-6 Astra**. CodexBar and CC Switch are references; MIT-licensed codex-usage source is retained with its notices.
