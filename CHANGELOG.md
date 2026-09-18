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
