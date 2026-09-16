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

---

# 1.2.0

## English

- Account quota pace estimates, fresh/stale states, reset countdowns and opt-in quiet alerts.
- Compact pinnable window, tray summary and keyboard navigation.
- Project/date → session → record drill-down; cost/recency sort and unpriced filters.
- Automatic monthly billing windows, month-end handling and non-recurring extra payments.
- Actionable data health, source removal without deleting history, and aggregate-only HTML sharing.
- No new runtime dependencies; all flows available in Chinese, English and Dutch.

## 简体中文

- 额度节奏估算、新鲜度标记、重置倒计时及可选免打扰提醒。
- 可置顶专注窗口、托盘摘要与键盘操作。
- 项目/日期 → 会话 → 记录下钻，支持费用/时间排序及未计价筛选。
- 月度账期自动滚动，处理月末日期，一次性额外实付不重复计入。
- 数据质量问题直达处理、保留历史的来源移除、匿名 HTML 摘要分享。
- 无新增运行依赖，所有流程支持中英荷三语言。

## Nederlands

- Limiettemposchattingen, actuele/verouderde status, aftellen tot herstel en optionele stille meldingen.
- Compact vastzetbaar venster, systeemvakoverzicht en toetsenbordbediening.
- Van project/datum naar sessie en record; sorteren op kosten/tijd en filteren op ontbrekende tarieven.
- Automatische maandelijkse perioden, maandultimo en eenmalige extra betalingen.
- Directe acties voor gegevenskwaliteit, bronnen stoppen met behoud van historie en anonieme HTML-overzichten.
- Geen nieuwe runtime-afhankelijkheden; Chinees, Engels en Nederlands.

# 1.1.0

## English

- Chinese, English and Dutch UI, tray menus, dialog titles and validation messages.
- System language detection, saved language preference, localized numbers and dates.
- Layout adjustments for longer translations and smaller windows.
- Three-language installer selection and GitHub documentation.
- Existing usage data and settings are retained. CSV identifiers and model names are unchanged.

## 简体中文

- 页面、托盘、文件窗口标题及校验信息支持中文、英语和荷兰语。
- 自动识别系统语言，保存语言偏好，数字和日期使用对应语言格式。
- 调整长文案及小窗口布局，增加安装语言选择与三语言说明。
- 保留已有使用数据和设置，CSV 字段及模型名不变。

## Nederlands

- Chinese, Engelse en Nederlandse interface, systeemvakmenu's, dialoogtitels en validatiemeldingen.
- Systeemtaaldetectie, opgeslagen taalvoorkeur en lokale getal- en datumnotatie.
- Aangepaste indeling voor langere vertalingen en kleinere vensters.
- Drietalige installatiekeuze en GitHub-documentatie.
- Bestaande gegevens en instellingen blijven behouden. CSV-identificaties en modelnamen blijven gelijk.

# 1.0.0

- Windows 安装包及便携 ZIP。
- 本机 Codex 增量采集、SQLite 存储、重扫及归档去重。
- 官方 Codex 账户连接、套餐额度和账户 Token 汇总。
- Standard API 等价成本、缓存分类、账期实付对比。
- 用量搜索、模型筛选、分页、CSV 导出、价格目录导入导出。
- 浅色/深色主题、托盘运行、可选开机启动。

UI 使用黑白灰层级；去除原型示例、宣传文案和演示切换。

## 边界

仅 Windows x64。首版价格为可更新的本地快照；只估算已采集的文本 Token 分类，不包含工具费用。普通 ChatGPT 聊天未接入。本构建未签名；自动更新未启用。
