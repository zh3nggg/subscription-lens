# 3.1.1 · 正式版

- 修复总览切换到“多设备”后扇形统计仍显示本机模型分布的问题。饼图和图例现在按已同步设备的模型记录重新汇总，并保留设备数据的未计价状态。
- 正式发布 Apple Silicon macOS Tauri 包：要求 macOS 13+，R2 凭据使用登录钥匙串，包含 GPT-6 Astra/Sol/Luna 精确身份与 Standard 计价；DMG、ZIP 和 SHA256 清单随 Release 提供。
- Fixed the overview distribution chart continuing to show local models after switching to multi-device view. The chart and legend now aggregate synchronized device models and preserve their unpriced status.
- Publishes the Apple Silicon macOS Tauri package for macOS 13+, with R2 credentials in the login Keychain, exact GPT-6 Astra/Sol/Luna identities and Standard pricing, plus DMG, ZIP and SHA256 assets.
- Publiceert het Apple Silicon macOS Tauri-pakket voor macOS 13+, met R2-referenties in de inlogsleutelhanger, exacte GPT-6 Astra/Sol/Luna-identiteiten en Standard-tarieven, plus DMG, ZIP en SHA256-bestanden.

# 3.1.0 · 正式版

- 稳定版汇总此前的 Tauri 迁移后修复：恢复额度预测、修正登录与刷新状态、避免 R2 表单刷新丢失，并完善 CodeBuddy、Qoder 与多设备统计。
- 修复多设备用量把已计算的 Codex 成本丢弃的问题：同步快照保留已计算金额；没有价格的数据明确显示未计价，不再误报 US$0.00。总览多设备和设备列表共用修复后的汇总。
- Windows x64 正式版继续内嵌 CC Switch 原版供应商管理与路由运行时；本地 Apple Silicon 包已跟进相同的 3.1.0 Tauri 基线，R2 凭据使用 macOS 登录钥匙串，并保留官方 3.1 的 R2 表单与多设备成本修复。
- 新增 GPT-6 Sol 与 GPT-6 Luna 的精确身份、路由别名和 Standard 计价；保留 GPT-6 Astra，并将价格快照更新到 2026-09-22。未知价格仍保持未计价。
- Consolidates the post-migration Tauri fixes for quota forecasts, account refresh and sign-in status, R2 form persistence, CodeBuddy/Qoder collection, and device statistics.
- Fixes multi-device Codex costs being dropped from snapshots. Calculated amounts are retained, genuinely unpriced usage remains visibly unpriced, and the overview/device list share the corrected totals.
- Windows x64 stable release with the original CC Switch provider manager and routing runtime embedded. The local Apple Silicon package now follows the same 3.1.0 Tauri baseline, stores R2 credentials in the macOS login Keychain, and retains the official R2 form and multi-device cost fixes.
- Adds exact GPT-6 Sol and GPT-6 Luna identities, routing aliases and Standard pricing alongside GPT-6 Astra, with the price snapshot updated to 2026-09-22. Unknown prices remain unpriced.
- De lokale Apple Silicon-build gebruikt nu dezelfde Tauri 3.1.0-basis, bewaart R2-referenties in de macOS-inlogsleutelhanger en behoudt de officiële fixes voor het R2-formulier en apparaatkosten. GPT-6 Sol en Luna hebben exacte identiteiten en tarieven; onbekende prijzen blijven ongeprijsd.

# 3.0.8 · 本地修正版

- 修复多设备用量把已计算的 Codex 成本丢弃的问题：Codex 会话记录未提供 `pricing_model` 标签，但已保存的金额有效；同步快照现在会保留正数计算成本。没有价格的记录保持未计价，设备、模型和日期汇总显示“—”，不再误报 US$0.00。
- Fixed multi-device usage dropping calculated Codex costs. Codex session rows have no `pricing_model` label even when their saved cost is valid, so snapshots now retain calculated nonzero costs. Truly unpriced records remain unpriced and show “—” in device, model, and date summaries instead of a misleading US$0.00.

# 3.0.7 · 本地修正版

- 修复总览套餐额度始终显示破折号的问题：Codex 接口返回的查询时间原先只挂在整份快照上，未传到单个额度窗口，导致新鲜数据也被预测模块判为过期。现在每个额度窗口都携带查询时间，并显示已读取的剩余额度；过期快照仍会标记为需刷新。
- Fixed the overview always hiding the remaining quota: the Codex response timestamp was attached to the snapshot but not copied to individual quota windows, so even fresh data was marked stale. Each window now carries the query timestamp and displays its remaining quota; genuinely stale snapshots still require refresh.

# 3.0.6 · 本地修正版

- 修复连接页把“已保存授权”误报成“已连接”，但额度查询实际失败或没有结果的问题。现在分开显示授权与额度读取状态，额度失败时在连接页和总览中展示返回的错误原因。
- 移除接口从未提供的套餐和账户累计 Tokens 占位行，改为显示授权账号、最后成功查询时间和额度窗口数；明确说明额度接口不返回账户累计 Tokens。
- Fixed the connection page showing “Connected” merely because OAuth credentials existed, even when quota retrieval had failed or returned no data. Authorization and quota-read status are now shown separately, with the actual query error surfaced on the connection page and dashboard.
- Removed plan and lifetime-token placeholders that the API never provides. The page now shows the authorized account, last successful query time, and quota-window count, and clarifies that lifetime account tokens are not returned by the quota API.

# 3.0.5 · 本地修正版

- 修复「刷新连接」只检查登录状态、可能命中旧查询缓存的问题。现在会强制查询最新 ChatGPT 套餐额度，成功后刷新总览；查询失败会显示具体原因。未登录时额度卡片直接进入 ChatGPT 登录流程。
- Fixed Refresh Connection only checking login status and sometimes reusing cached quota. It now forces a fresh ChatGPT quota query, updates the dashboard on success, and displays query errors; signed-out users are directed to ChatGPT sign-in.

# 3.0.4 · 本地修正版

- 修复 ChatGPT 登录：Tauri 返回的设备授权字段为 snake_case，前端却按 camelCase 读取，导致验证链接和设备码为空。现在使用真实的验证 URL 和设备码启动浏览器授权与轮询。
- Fixed ChatGPT sign-in by reading the snake_case device authorization fields returned by Tauri, so the verification URL opens and account polling uses the returned device code.

# 3.0.3 · 本地修正版

- 修复设备页 R2 设置未保存时被后台刷新覆盖的问题。编辑表单时，周期性数据刷新和后台同步只更新内部数据，不重绘表单；密钥仍仅在输入框与提交期间驻留内存。
- Fixed the R2 device-sync form being reset by periodic refreshes before saving. Background queries no longer rerender the form while it is being edited; credentials remain out of persistent draft storage.

# 3.0.2 · 稳定版

- 修复 Tauri 启动时使用 CC Switch 默认窗口配置、导致主窗口直接打开 CC Switch 界面的问题。主程序现在在 Sublens host 中生成并传入自己的 Tauri context；CC Switch 继续提供供应商管理和路由运行时。
- 修复嵌入构建补丁的上下文错位，并让迁移构建脚本识别已完整就绪的本地 CC Switch runtime，避免对已有修改重复打补丁。
- Fixed Tauri startup loading CC Switch's default window and frontend. The Subscription Lens host now creates and passes its own Tauri context, while CC Switch continues to provide provider management and routing.
- Corrected the embedded build patch context and made the migration build script recognize an already prepared local CC Switch runtime.
- Verholpen dat Tauri bij het starten de standaardweergave van CC Switch opende. De Subscription Lens-host maakt nu zelf de Tauri-context en geeft die door; CC Switch blijft de providerbeheerder en routeringsruntime leveren.

# 3.0.1

- 修复 Tauri 版额度可用时间预测始终不显示的问题。应用现在会在本机保存成功的额度观测，并按账号、额度窗口和重置周期隔离；至少积累三次、跨度15分钟后，显示本周期、近24小时和近2小时预测。
- Fixed quota availability forecasts always appearing empty in the Tauri app. Successful quota observations are stored locally and isolated by account, quota window and reset. Current-window, 24-hour and 2-hour estimates appear after at least three observations spanning 15 minutes.
- De Tauri-app toonde de resterende quotatijd nooit. Succesvolle quota-observaties worden nu lokaal opgeslagen en gescheiden per account, venster en resetmoment. Schattingen voor het huidige venster, 24 uur en 2 uur verschijnen na minimaal drie observaties verspreid over 15 minuten.
- 正式版加入 CodeBuddy / Qoder 本地用量采集和可选 Cloudflare R2 多设备统计同步；R2 只传 Sublens 匿名统计快照，不上传源日志、正文、项目路径或凭据。
- Includes local CodeBuddy and Qoder usage collection and optional Cloudflare R2 multi-device statistics sync. R2 transfers only anonymized Sublens usage snapshots, never source logs, chat text, project paths or credentials.
- Bevat lokale gebruiksverzameling voor CodeBuddy en Qoder en optionele statistieksynchronisatie tussen apparaten via Cloudflare R2. R2 verzendt alleen geanonimiseerde Sublens-snapshots, nooit bronlogs, chattekst, projectpaden of inloggegevens.

# 3.0.0-beta.3 · 本地预览（未发布）

Windows 本地测试安装包包含本节所列的多设备 R2 同步、设备总览及近期 Tauri 修复。安装包保存在本机，未创建 GitHub Release；源码随项目更新提交。

- Tauri Windows 版新增可选 Cloudflare R2 多设备同步：每台设备在专用 bucket 前缀下维护一个 Sublens JSON 统计快照；密钥进入 Windows 凭据管理器，快照仅含匿名记录/会话标识、时间、模型、Token 分类与可用计价，不含原始日志、聊天正文、项目路径或认证信息。bucket 支持应用内创建；打开应用时同步，并在运行期间每 5 分钟双向同步。
- 新增总览「本机 / 多设备」视图，并支持在设备页查看已同步设备统计和按设备打开用量记录。
- Added opt-in Cloudflare R2 multi-device sync to the Windows Tauri app. Each device maintains one Sublens JSON usage snapshot under a dedicated bucket prefix. Keys are stored in Windows Credential Manager; snapshots contain only anonymized record/session IDs, timestamps, models, token categories and available pricing, never raw logs, chat text, project paths or auth data. Buckets can be created in-app. Sync runs on launch and every five minutes while the app remains open.
- Added a Local / All devices selector to the Codex overview, plus a synced-device list and per-device usage drill-down.
- De Windows Tauri-app kan nu optioneel gebruikssnapshots via Cloudflare R2 tussen apparaten synchroniseren. Elk apparaat beheert één Sublens-JSON-bestand onder een aparte bucketprefix. Sleutels staan in Windows Credential Manager; snapshots bevatten alleen geanonimiseerde record-/sessie-ID's, tijdstippen, modellen, tokencategorieën en beschikbare tarieven, nooit ruwe logs, chattekst, projectpaden of authenticatiegegevens. Buckets kunnen in de app worden aangemaakt. Synchronisatie gebeurt bij het starten en elke vijf minuten zolang de app open is.
- Het Codex-overzicht heeft nu een keuze tussen Dit apparaat en Alle apparaten; de apparatenpagina toont gesynchroniseerde totalen en gebruik per apparaat.
- Tauri 版多供应商采集支持 CodeBuddy 与 Qoder：自动发现常用目录，也可选择自定义日志目录；扫描记录只保存请求用量元数据，不保存聊天正文或原始日志。用量视图支持来源筛选、分页、跨来源重复提示；价格视图支持本地自定义计价规则，未知价格继续标为未计价。
- Added Tauri collectors for CodeBuddy and Qoder with common-folder discovery and custom log-folder selection. Scans retain usage metadata only, never chat bodies or raw log lines. Usage supports source filtering, pagination and cross-source duplicate hints; custom local price rules are available and unknown prices remain unpriced.
- De Tauri-app verzamelt nu lokaal gebruik van CodeBuddy en Qoder, met automatische detectie en keuze van een aangepaste logmap. Alleen gebruiksmetadata wordt bewaard, geen chatinhoud of ruwe logs. Gebruik ondersteunt bronfilters, paginering en meldingen bij mogelijke dubbelen; onbekende prijzen blijven ongeprijsd.
- Windows Tauri 版（包括调试启动）现在不会附带终端窗口，诊断信息仍写入应用日志。
- Windows Tauri builds now launch without an attached terminal window, including debug builds; diagnostics remain available in the app log.
- Windows Tauri-builds starten nu zonder gekoppeld terminalvenster, ook tijdens debuggebruik; diagnostiek blijft beschikbaar via het app-logboek.
- 修复 Tauri 版切换到多供应商视图后，用量和价格页面因监控数据结构不完整而崩溃的问题；无已连接来源时显示明确空状态，不将 Codex 本机统计误作多供应商记录。
- Fixed crashes in the Tauri multi-provider usage and pricing views caused by an incomplete monitor data shape. Empty states now appear when no monitor source is connected, without presenting local Codex statistics as multi-provider records.
- Herstelde crashes in de Tauri-weergaven voor gebruik en prijzen met meerdere providers. Zonder verbonden bron verschijnt nu een lege status; lokale Codex-statistieken worden niet als gegevens van meerdere providers weergegeven.

# 3.0.0-beta.2

- 新增 Apple Silicon macOS 构建：Electron 主应用、内嵌 CC Switch Router、Codex 自动发现、菜单栏与托盘均已适配 arm64 macOS；发布流程生成临时签名的 DMG、ZIP 与 SHA256 清单。
- 修复无头 CC Switch Rust 核心在 macOS 下的模块路径和 Windows-only 依赖边界；接管、热切换与恢复已通过 arm64 原生集成测试。
- Added an Apple Silicon macOS build with a native arm64 CC Switch router, Codex discovery, macOS menus and tray behavior, ad-hoc-signed DMG/ZIP artifacts, and SHA256 manifests.
- Fixed the headless CC Switch Rust module path and target-scoped Windows dependencies; takeover, hot switching, and official restore now pass native arm64 integration tests.

# 3.0.0

- 首个多供应商功能真正稳定可用的 Windows 版本：Tauri 主程序内嵌原版 CC Switch 供应商管理界面和原生路由运行时，统一使用 CC Switch 的授权、保存、切换、回滚和本机代理流程，无需另装 CC Switch。
- 保留 Subscription Lens 的侧栏、总览、额度、分布饼图与项目／会话／记录用量界面；修复路由页管理入口和双列卡片按钮高度错位。
- Windows 发行文件包含 CC Switch MIT 许可与第三方说明；macOS Apple Silicon 3.0.0-beta.2 仍为 Electron 预览版。
- First reliably usable Windows multi-provider release: the Tauri app embeds the original CC Switch provider manager and native routing runtime. Authorization, persistence, switching, rollback and the local proxy use CC Switch's own flows, with no separate installation.
- Retains the Subscription Lens monitoring interface and aligns provider-card actions. Windows packages include the CC Switch MIT license and third-party notice; the macOS beta.2 remains an Electron preview.
- Eerste betrouwbaar bruikbare Windows-versie met meerdere providers: de Tauri-app bevat de originele CC Switch-providerbeheerder en routeringsruntime. Autorisatie, instellingen, wisselen, herstel en lokale proxy gebruiken de CC Switch-implementatie; licentie en bronvermelding zijn opgenomen. De macOS beta.2 blijft een Electron-preview.

# 3.0.0-beta.1

- 3.0 是从 1.6.x 稳定版本线跳到的新一代预览版；此前公开版本使用 Electron，本版本继续沿用 Electron 界面，并将兼容 CC Switch 的路由运行时打包进应用。
- 统计页恢复项目 → 会话 → 记录的逐级浏览：从 Codex 请求日志恢复真实 session_id，结合本机会话目录中的项目路径和标题，支持筛选、排序和分页。
- 修复统计查询缓存遗漏项目、会话、日期、未计价和排序条件的问题，避免切换 Tab 后继续显示上一层结果。
- 内嵌兼容 CC Switch 的路由运行时，提供应用内供应商配置、API Key 安全存储、模型发现、模型映射，以及 OpenAI Official 与第三方供应商之间的恢复流程。
- 供应商编辑器沿用 CC Switch 的 Codex 预设体系，支持模板搜索、自动填充、协议选择和连接测试；切回官方时只清理本应用管理的模型目录配置，保留 ChatGPT 登录状态和其他 Codex 设置。
- Added the project → session → record hierarchy to the usage page, restoring Codex session IDs, project paths and titles from the local catalog with filtering, sorting and pagination.
- Fixed usage query caching so project, session, day, unpriced and sort filters cannot reuse an unrelated tab snapshot.
- Bundled a CC Switch-compatible routing runtime for in-app provider configuration, secure API-key storage, model discovery, model mappings and safe restoration to OpenAI Official.
- The provider editor follows the CC Switch Codex preset system with searchable templates, automatic field filling, protocol selection and connection tests. Official restore clears only app-owned model-catalog settings while preserving ChatGPT login state and unrelated Codex settings.

# 2.0.0

- 正式集成嵌入式 CC Switch 路由，可在 Subscription Lens 内配置第三方 OpenAI 兼容供应商、API Key、模型目录和 Codex 兼容模型映射。
- 切换到第三方供应商时由本地代理转换兼容模型别名；切回 OpenAI Official 时恢复官方模型目录并保留 ChatGPT 登录状态。
- 路由补丁已纳入可复现构建流程；全新克隆源码也能生成与正式发行一致的嵌入式路由组件。
- Officially integrates embedded CC Switch routing with in-app provider credentials, model discovery, and Codex-compatible model mappings. Returning to OpenAI Official restores the official model catalog while preserving the ChatGPT login.

# 2.0.0-beta.5

- 修复切回 OpenAI Official 后仍引用第三方模型目录的问题。官方切换现在严格按照 CC Switch 的顺序执行：接管状态下先切换到内置 `codex-official` provider，重建官方恢复状态，再关闭接管；同时检测升级遗留的 `subscription-lens-*` 配置并在 CCS 备份缺失时执行不触碰 `auth.json` 的配置兜底修复。
- Fixed third-party model catalogs remaining active after switching back to OpenAI Official. The switch now follows CC Switch ordering: select the built-in `codex-official` provider while takeover is active, rebuild official restore state, then release takeover. Stale `subscription-lens-*` configurations from older previews are detected and repaired without modifying `auth.json` when the CCS backup is unavailable.

# 2.0.0-beta.4

- 路由接管、热切换与恢复现在完全由嵌入式 CC Switch 的原生事务和备份管理，移除 Subscription Lens 的第二套 config.toml 备份/恢复，避免旧备份覆盖 CCS 的本地代理或认证保留状态。第三方供应商保留其真实名称；禁止将第三方命名为 `OpenAI`，因为这正是 CCS 用来显式开启 Codex 远程压缩的开关。
- Routing takeover, hot switching, and restoration now use the embedded CC Switch native transaction and backup lifecycle exclusively. The second Subscription Lens config backup/restore path was removed so stale state cannot overwrite CCS proxy or authentication preservation. Third-party providers retain their real name and cannot be named `OpenAI`, which CCS uses as the explicit remote-compaction opt-in.

# 2.0.0-beta.3

- 修复 CCS 热切换复用残缺 `config.toml` 时只写入 `model_provider`、未补齐 `[model_providers.<id>]` 导致 Codex 启动失败的问题。切换第三方供应商现在会重新投影完整 provider 配置；切回官方继续使用原始配置快照，不会清除 ChatGPT 登录状态。
- Fixed CCS hot-switches that reused an incomplete `config.toml` containing only `model_provider` without its `[model_providers.<id>]` table. Third-party switches now re-project the complete provider configuration, while restoring official keeps the original config and ChatGPT login state.

# 2.0.0-beta.2

- 修复第三方路由下的远程压缩请求绕过本地代理并直连 `api.openai.com` 的问题。第三方供应商现在明确关闭 Codex WebSocket 能力，避免在没有 ChatGPT bearer 的情况下触发 401。
- Fixed third-party routed sessions bypassing the local proxy for remote compaction and calling `api.openai.com` directly. Third-party providers now explicitly disable Codex WebSocket capabilities to avoid 401 errors without a ChatGPT bearer.

# 2.0.0-beta.1

- 首个 2.0 beta：在路由供应商设置中加入通用的 Codex 兼容模型映射表。用户可查看并编辑“Codex 前台模型 → 供应商上游模型”，适用于 DeepSeek、Qwen、Kimi、OpenRouter 及自定义兼容端点。
- First 2.0 beta: provider settings now include a generic Codex-compatible model mapping table for DeepSeek, Qwen, Kimi, OpenRouter and custom compatible endpoints.
- Eerste 2.0 beta: providerinstellingen bevatten nu een algemene tabel voor Codex-compatibele modeltoewijzingen voor DeepSeek, Qwen, Kimi, OpenRouter en aangepaste compatibele endpoints.

# 3.0.0 development history

- 修复双列供应商卡片中“在 CC Switch 中管理”按钮的高度错位：卡片内容改为纵向弹性布局，操作按钮统一贴齐卡片底部并保持相同高度。
- Aligned the management buttons at the bottom of two-column provider cards and gave them a consistent height.

- 将内嵌 CC Switch 页面中的“返回余量”按钮移到左上角导航栏，避免浮动按钮遮挡页面内容。
- Moved the return button in the embedded CC Switch page into the upper-left navigation area so it no longer floats over page content.

- “在 CC Switch 中管理”现在在已工作的 Tauri 主窗口中直接打开内嵌的原版 CCS 页面，并提供“返回余量”按钮。去掉独立子窗口及其额外权限配置，保留 CCS 自身的授权、保存和切换流程。
- “Manage in CC Switch” now navigates the working Tauri main window to the bundled original CCS page with a return button. The separate child window and its extra permissions are removed while CCS retains its own authorization, persistence and switching flow.

- 路由页不再自行拼装或保存供应商配置。新增、编辑、测试、切换和 OpenAI Official 授权现在一律打开同一可执行文件中打包的原版 CC Switch 供应商管理器；OpenAI Official 使用 CC Switch 单独保存的 Codex OAuth 账号，不依赖或覆盖 Codex GUI 当前登录态。该界面包含 CC Switch 的完整高级选项、模型目录和映射、请求覆盖及账户管理流程。
- The Route page no longer constructs or stores provider configuration itself. Creation, editing, testing, switching and OpenAI Official authorization now open the original CC Switch provider manager bundled in the same executable. OpenAI Official uses the separately stored CCS Codex OAuth account rather than the current Codex GUI login; its full advanced options, model catalog/mappings, request overrides and account management flow are available there.

- 修复 Tauri 连接页把每条 CCS 请求日志误报成一个 Codex 会话、在 10,000 条读取上限处显示假性累计值且始终显示 0 个源文件的问题；现在会话和文件数来自 CCS 原生会话扫描器。项目页只根据可关联的 Codex 会话分组，模型摘要会在单元格内截断，不再撑出横向滚动。
- Fixed Tauri connection statistics that treated every CCS request log as a Codex conversation, surfaced the 10,000-row read limit as a false count, and always showed zero source files. Session and file counts now come from CCS's native session scanner. Projects aggregate only linkable Codex sessions and model summaries truncate within their cells.
- Tauri 主界面恢复为 Subscription Lens 的原有 Electron 视觉体系：侧栏、总览、套餐额度、分布饼图、活动页的项目 / 会话 / 记录 tab 和统计卡片保持原布局；供应商持久化、OAuth、保存、切换、回滚和本地代理继续由同一套 CCS 原生命令和数据库处理。
- The Tauri main window restores the established Subscription Lens Electron visual system: sidebar, overview, quota, distribution chart, activity project/session/record tabs and statistic cards keep their original layout. Provider persistence, OAuth, saving, switching, rollback and the local proxy continue to use the same native CCS commands and database.
- 供应商保存链路现在按 CC Switch 的 Codex `settingsConfig` 结构落盘：认证、完整配置和 `modelCatalog.models` 一起保存；模型目录保留显示名、上下文窗口、推理档位等字段，编辑时不输入新 API Key 也不会清空已保存凭据。模型发现结果也直接转换为同一目录结构，并由内嵌路由按该目录投影到 Codex。
- Provider persistence now follows CC Switch's Codex `settingsConfig` shape: authentication, the complete config and `modelCatalog.models` are saved together. Model display names, context windows and reasoning levels survive edits, and leaving the API Key blank no longer clears the encrypted credential. Discovery results use the same catalog shape and the embedded router projects it to Codex.
- 路由供应商编辑器新增可编辑的模型映射表：Codex 前台显示兼容别名，嵌入式 CC Switch 按每行映射到任意供应商的上游模型。适用于 DeepSeek、Qwen、Kimi、OpenRouter 和自定义兼容端点；模型菜单不再暴露会被 ChatGPT 登录态拒绝的第三方 slug。
- The route-provider editor now has an editable model mapping table: Codex shows compatible aliases and the embedded CC Switch maps every row to an upstream model for any provider. It supports DeepSeek, Qwen, Kimi, OpenRouter and custom compatible endpoints without placing third-party slugs in the ChatGPT-authenticated picker.
- De route-providereditor heeft nu een bewerkbare modeltoewijzingstabel: Codex toont compatibele aliassen en de ingebedde CC Switch vertaalt elke rij naar een upstreammodel van elke provider. Dit ondersteunt DeepSeek, Qwen, Kimi, OpenRouter en aangepaste compatibele endpoints zonder externe slugs in de ChatGPT-aangemelde modelkiezer te tonen.

- 路由供应商编辑器改为先配置 API Key 再获取模型；已加密保存的密钥可在再次编辑时直接用于获取和测试，不会回填或显示明文。嵌入式 CC Switch 路由将 ChatGPT 登录会话保留在兼容的 Codex 模型别名上，再映射到选定的上游模型，避免第三方模型 slug 被客户端提前拒绝。
- The route-provider editor now collects an API key before model discovery; an encrypted saved key remains usable for discovery and tests on later edits without being revealed. Embedded CC Switch routing keeps ChatGPT-authenticated chats on a compatible Codex alias and maps it to the chosen upstream model, avoiding client-side rejection of third-party slugs.
- De route-providereditor vraagt nu eerst om een API-sleutel voordat modellen worden opgehaald; een versleuteld opgeslagen sleutel blijft bij latere wijzigingen bruikbaar voor ophalen en testen zonder zichtbaar te worden. De ingebedde CC Switch-router houdt ChatGPT-aangemelde chats op een compatibel Codex-aliasmodel en vertaalt dit naar het gekozen upstreammodel, zodat externe modelslugs niet door de client worden geweigerd.
- 用量趋势新增可点击的活动热力图，并提高柱状与累计图的坐标轴刻度字号。
- Usage trends now include an interactive activity heatmap and larger axis labels for bar and cumulative charts.
- Gebruikstrends bevatten nu een interactieve activiteitskaart en grotere aslabels voor staaf- en cumulatieve grafieken.
- 修复额度窗口读取：同时保留默认额度和分类额度，并使用分类键识别窗口；单个额度通知不再覆盖其他额度，保留各窗口原始观测时间。
- Fix quota window ingestion: combine default and indexed limits, preserve map identities, and merge single-limit notifications without refreshing unrelated observations.
- Herstel quotavensters: combineer standaardlimieten en limieten per categorie, behoud hun identiteit en voeg meldingen samen zonder andere waarnemingen te vernieuwen.
