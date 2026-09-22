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

# Unreleased

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
