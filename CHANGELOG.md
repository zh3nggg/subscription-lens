# 2.1.0-beta.1

- 供应商新增/编辑流程改用 CC Switch 的 Codex 预设体系：构建时从固定版本的 `codexProviderPresets.ts` 自动同步 85 个预设，并采用相同的可搜索、可排序预设网格、模板自动填充和模型目录初始化逻辑。DeepSeek 会直接带出当前 CC Switch 预设中的 V4 Flash / V4 Pro。
- API Key、模板选择和模型映射现在在界面重新渲染后保持草稿状态；新增隔离 Electron 烟测覆盖模板搜索、DeepSeek 自动填充、两条模型映射和密钥输入持久性。
- 切回 OpenAI 后始终清理 Subscription Lens 管理的模型目录指令，避免前台继续只显示第三方映射模型，同时保留登录状态和其他 Codex 设置。
- The provider editor now uses CC Switch's Codex preset system: 85 presets are generated from the pinned `codexProviderPresets.ts` at build time, with the same searchable and sortable preset grid, template filling, and catalog initialization behavior.

- 修复切回 OpenAI 后仍残留 `cc-switch-model-catalog.json`、导致前台只显示第三方映射别名的问题。官方恢复现在始终执行一次范围严格的路由配置清理，保留登录状态和其他 Codex 设置。
- Fixed a stranded `cc-switch-model-catalog.json` after switching back to OpenAI, which left the frontend showing only third-party mapped aliases. Official restore now always performs a narrowly scoped route cleanup while preserving authentication and all unrelated Codex settings.

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
