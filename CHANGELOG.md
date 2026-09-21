# 3.0.0-beta.1

- 修复 Tauri 用量页的“项目”和“会话”Tab：从 Codex 请求日志恢复真实 `session_id`，读取 Codex 会话目录中的项目路径和标题，并恢复项目 → 会话 → 记录的逐级筛选、排序和分页逻辑。
- 修复 Tauri usage ledger 查询缓存未包含项目、会话、日期和排序条件的问题，避免切换 Tab 后继续显示旧结果。
- Added the complete project → session → record hierarchy to the Tauri usage page. Codex session IDs, titles, and working directories are restored from the local Codex catalog, with filtering, sorting, and pagination matching the Electron implementation.
- Fixed usage query caching so project, session, day, unpriced, and sort filters cannot reuse an unrelated tab snapshot.

# 2.1.0-beta.1

- 移除 Tauri 左侧导航栏中容易与应用标识混淆的品牌图标；窗口左上角、任务栏和默认窗口图标改用 Subscription Lens 自有图标资源，不再复用 CC Switch 图标。
- Removed the decorative brand icon from the Tauri sidebar and switched the window, taskbar, and default window icon to Subscription Lens assets instead of the CC Switch icon.
- 优化 Tauri 页面切换：相同筛选条件下复用短时查询快照并合并并发请求，避免每次切换 Tab 都重复读取完整 Codex 日志；刷新、重新扫描、供应商切换和设置保存会主动清空缓存。
- Improved Tauri tab navigation by reusing short-lived query snapshots and coalescing concurrent requests; refresh, rescan, provider changes, and settings saves explicitly invalidate the cache.
- 修复总览模型/供应商用量与旧版口径不一致：保留 CCS 的缓存归一化统计，同时为 Tauri 前端补充包含缓存命中的实际 Tokens，并按模型家族恢复 OpenAI、DeepSeek、Unknown 等供应商分布；会话数改为按真实 Codex session_id 去重。
- Fixed the overview distribution mismatch: the Tauri bridge now exposes cache-inclusive model/provider totals alongside CCS's normalized values, restores OpenAI/DeepSeek/Unknown provider families, and counts distinct Codex sessions from the imported session IDs.
- 将 `codex-auto-review` 从 Unknown 中单独归类为 Codex Auto Review，展开供应商用量时可以直接看到准确模型名称。
- Classified `codex-auto-review` as Codex Auto Review instead of Unknown so the provider drill-down exposes the actual model name.
- 修复 Tauri 总览增强层读取缺少 `health`、`desktop` 和额度窗口字段导致页面空白/报错的问题；同时保留真实错误信息，不再只显示“无法读取数据”。
- 新增嵌入式前端日志：渲染器启动、未处理异常和 Tauri 命令失败会写入 `~/.cc-switch/logs/subscription-lens-frontend.log`，方便定位 WebView 页面问题。
- 前端日志会对 API Key、Token、密码、Authorization 和其它凭据字段自动脱敏。
- Fixed the Tauri overview crash caused by missing `health`, `desktop`, and quota-window fields, and surfaced the real error instead of showing only a generic read failure.
- Added embedded frontend logging. Renderer startup, unhandled exceptions, and failed Tauri commands are written to `~/.cc-switch/logs/subscription-lens-frontend.log`.
- Tauri 迁移版现在直接复用 Electron 版的完整页面壳、导航、统计视图、用量卡片和视觉样式，不再只提供总览页；新增 `tauri-bridge.js` 将这些页面接到嵌入式 CC Switch 的用量、供应商、设置和认证命令。
- The Tauri migration build now reuses the complete Electron shell, navigation, statistics views, usage cards, and visual styling instead of exposing only the overview page. `tauri-bridge.js` connects those pages to embedded CC Switch usage, provider, settings, and authentication commands.
- 修正 Tauri 供应商保存时的认证边界：只有 OpenAI Official 写入 `requires_openai_auth = true`，第三方供应商沿用 CCS 规则写入 `false`，避免远程压缩请求误连 `api.openai.com`。
- Fixed the provider-auth boundary in the Tauri bridge: only OpenAI Official writes `requires_openai_auth = true`; third-party providers follow CCS and write `false`, preventing remote compaction from accidentally calling `api.openai.com`.
- 嵌入式 CC Switch 路由现在始终保留 Codex 原生 ChatGPT OAuth 登录；切换第三方供应商、热切换以及返回 OpenAI Official 的回归测试会验证 `auth.json` 全程逐字节不变，避免再次弹出浏览器登录。
- 供应商新增/编辑流程改用 CC Switch 的 Codex 预设体系：构建时从固定版本的 `codexProviderPresets.ts` 自动同步 85 个预设，并采用相同的可搜索、可排序预设网格、模板自动填充和模型目录初始化逻辑。DeepSeek 会直接带出当前 CC Switch 预设中的 V4 Flash / V4 Pro。
- API Key、模板选择和模型映射现在在界面重新渲染后保持草稿状态；新增隔离 Electron 烟测覆盖模板搜索、DeepSeek 自动填充、两条模型映射和密钥输入持久性。
- 切回 OpenAI 后始终清理 Subscription Lens 管理的模型目录指令，避免前台继续只显示第三方映射模型，同时保留登录状态和其他 Codex 设置。
- The provider editor now uses CC Switch's Codex preset system: 85 presets are generated from the pinned `codexProviderPresets.ts` at build time, with the same searchable and sortable preset grid, template filling, and catalog initialization behavior.

- 修复切回 OpenAI 后仍残留 `cc-switch-model-catalog.json`、导致前台只显示第三方映射别名的问题。官方恢复现在始终执行一次范围严格的路由配置清理，保留登录状态和其他 Codex 设置。
- Fixed a stranded `cc-switch-model-catalog.json` after switching back to OpenAI, which left the frontend showing only third-party mapped aliases. Official restore now always performs a narrowly scoped route cleanup while preserving authentication and all unrelated Codex settings.
- 新增 Tauri 迁移主机：直接复用固定版本 CC Switch Rust 运行时的供应商、切换和托管 Codex OAuth 命令；当前迁移前端已通过原生 `invoke` 读取供应商及认证状态，Electron 继续作为回退入口。
- Added the first Tauri migration host. It calls the pinned CC Switch Rust runtime directly for providers, switching, and managed Codex OAuth; the migration renderer now reads provider and auth state through native `invoke`, while Electron remains the fallback entry point.
- 迁移壳现在可以直接调用 CCS 原生 `switch_provider` 完成 Codex 供应商切换，并在切换后重新读取当前供应商和认证状态。
- The migration shell can now invoke CCS's native `switch_provider` transaction and refresh the active provider and auth state after switching.
- Tauri 迁移壳新增 CCS 托管 Codex 账号列表、认证状态刷新和退出托管登录操作，验证 OpenAI Official 的独立认证边界。
- The Tauri migration shell now exposes the managed Codex account list, auth refresh, and managed logout, validating the independent OpenAI Official authentication boundary.
- Tauri 迁移壳新增 Codex OAuth 设备授权、轮询和授权结果回显，用户可以在 Sublens 窗口内完成 CCS 托管登录。
- The Tauri migration shell now supports Codex OAuth device authorization, polling, and result feedback inside the Subscription Lens window.
- 新增 CCS 原生 `modelCatalog.models` JSON 输入区，供应商创建时可以明确声明 Codex 可识别的模型名、显示名、上下文窗口和推理档位；保存前进行结构校验。
- Added a CCS-compatible `modelCatalog.models` JSON field for provider creation, with validation before persistence.
- 供应商卡片现在支持基于 CCS 原生 `update_provider` 的编辑；检视器会对 auth 字段脱敏，编辑已有供应商必须重新输入替换 API Key，避免凭据进入前端状态。
- Provider cards now support CCS-native `update_provider`; the inspector redacts auth fields and editing an existing provider requires an explicitly entered replacement API Key.
- Tauri 迁移壳补充供应商删除操作，内置供应商不可删除；删除后重新读取 CCS 数据库状态。
- The Tauri migration shell now supports deleting non-built-in providers while protecting built-in entries and refreshing CCS state afterward.
- 供应商卡片新增 CCS 原生地址测速，只发送 base_url 并回显延迟，不在前端执行带密钥的模型请求。
- Provider cards now use CCS's native endpoint speed test, sending only `base_url` and reporting latency without performing a keyed model request in the renderer.
- 新增 `scripts/build-tauri-migration-host.ps1`，统一执行 Tauri 迁移主机的 check/build，避免不同环境手工调用参数不一致。
- Added a single PowerShell entry point for checking or building the Tauri migration host with a consistent target directory.
- 已完成一次完整 Tauri debug 构建验证，生成 `subscription-lens-tauri.exe`；当前只作为迁移验证产物，不替代现有 Electron 安装包。
- Completed a full Tauri debug build validation and produced `subscription-lens-tauri.exe`; it remains a migration verification artifact and does not replace the Electron installer yet.
- Tauri 迁移壳补充托管账号管理：可设置默认 Codex 账号、移除单个账号，并在操作后刷新 CCS 状态。
- The Tauri migration shell now supports selecting a default managed Codex account and removing an individual account, with state refresh after each operation.
- Tauri 迁移壳新增供应商 `settingsConfig` 检视面板，直接展示 CCS 保存的真实配置结构，后续编辑器将基于该结构接入。
- The Tauri migration shell now includes a provider `settingsConfig` inspector so the next editor integration can use the exact CCS-persisted structure.
- 新增一个受限的 CCS Codex 供应商新增表单：按 CCS 的 `{ auth, config }` 结构写入数据库，默认不直接加入 live 配置，避免未经验证的供应商立即接管 Codex。
- Added a constrained CCS Codex provider creation form. It persists the CCS `{ auth, config }` shape and defaults to database-only (`addToLive: false`) so an unverified provider cannot immediately take over Codex.
- 修复 Tauri Windows 主机缺少 Common Controls v6 清单导致的 `TaskDialogIndirect` 入口点错误；同时为 WebView2 设置独立的数据目录，避免与 CCS/Electron 实例争用运行目录。
- Fixed the Tauri Windows host's missing Common Controls v6 manifest that caused the `TaskDialogIndirect` entry-point error, and assigned WebView2 an isolated data directory so it does not contend with CCS or Electron instances.
- 修复调试可执行文件误用 `devUrl=http://localhost:1420` 的问题；迁移主机现在直接加载内置静态前端，不需要额外启动本地开发服务器。
- Fixed the migration executable accidentally using `devUrl=http://localhost:1420`; it now loads the embedded static frontend and requires no separate local development server.
- 为迁移壳提供空的更新器配置，避免启动时因未配置更新源产生无害但误导性的 Updater 警告。
- Added an explicit empty updater configuration for the migration shell, removing the harmless but misleading startup warning caused by a missing update source.

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
