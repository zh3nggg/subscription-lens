# Roadmap

[English](#english) · [简体中文](#简体中文) · [Nederlands](#nederlands)

## English

### Current release: 1.3.0-beta.1 preview

Windows desktop app for Codex subscriptions, with Chinese, English and Dutch UI. Local usage analytics, account quota, billing comparison, compact view and optional notifications are available. Full Codex feature parity with CodexBar and codex-usage is **not yet complete**. See [coverage](docs/COMPATIBILITY.md).

### Next release target: 1.4 domestic coding-platform compatibility

- Add first-class, read-only connectors for **Qwen Code, Kimi Code CLI and CodeBuddy Code**, using documented local usage/telemetry surfaces and never collecting prompt or response bodies.
- Recognize domestic services used through **Claude Code, CC Switch and OpenAI/Anthropic-compatible gateways**, including GLM Coding Plan and model families from Qwen, Kimi, MiniMax and DeepSeek. Preserve the actual provider, plan and model instead of grouping them under `Other` or the client application.
- Normalize token semantics across clients: fresh input, cache read/write, output and reasoning; expose record provenance and avoid adding overlapping proxy and local logs together.
- Support subscription quota/credits only where a documented, user-authorized interface exists. Otherwise show local tokens and estimated/API-reported cost without presenting them as remaining plan quota or an invoice.
- Add connector detection, a compatibility status page, fixtures and three-language tests. A platform is marked supported only after token totals, model attribution, deduplication, privacy and upgrade behavior pass its acceptance fixture.
- Continue the active Codex accounting migration and task/agent attribution work without creating a second dashboard.

The initial acceptance set and evidence levels are tracked in [Domestic platform compatibility](docs/DOMESTIC-COMPATIBILITY.md). IDE-only products without a documented local export, log or API remain candidates rather than promised support.

Current scope includes Codex subscriptions and optional local provider records (CC Switch, Claude Code, Gemini CLI and JSONL). New providers will be optional. No separate embedded dashboards or mandatory cloud account are planned.

## 简体中文

### 当前版本：1.3.0-beta.1 预发布

面向 Codex 套餐的 Windows 桌面应用，支持中文、英语、荷兰语。已提供本地用量分析、账户额度、账期对比、专注窗口和可选提醒。**尚未完整覆盖 CodexBar 与 codex-usage 的 Codex 功能**，详见[覆盖清单](docs/COMPATIBILITY.md)。

### 下一版本目标：1.4 国产编码平台兼容版

- 首批加入 **Qwen Code、Kimi Code CLI、CodeBuddy Code** 的只读连接器，只使用官方说明的本地用量或遥测出口，不采集提示词和回复正文。
- 识别经 **Claude Code、CC Switch、OpenAI/Anthropic 兼容网关**调用的国产服务，包括 GLM Coding Plan，以及通义、Kimi、MiniMax、DeepSeek 等模型族；保留真实供应商、套餐和模型，不再笼统归入 `Other` 或客户端名称。
- 统一普通输入、缓存读写、输出和推理 Tokens 的口径；每条记录显示来源，并避免把代理日志与本地日志重复相加。
- 只有存在官方、经用户授权的接口时才显示套餐额度或积分；其余情况仅展示本地 Tokens 和估算／来源报告费用，不冒充剩余额度或实际账单。
- 增加自动发现、兼容状态页、合成样本和三语言测试。只有 Tokens、模型归属、去重、隐私与升级行为均通过验收的版本，才标记为已支持。
- 同时继续完成 Codex 统计引擎迁移和任务／代理归属，不另建第二套监控面板。

首批验收范围和证据级别见[国产平台兼容目标](docs/DOMESTIC-COMPATIBILITY.md)。仅有封闭 IDE、没有公开本地导出／日志／接口的平台先列为候选，不提前承诺支持。

当前已包含 Codex 套餐，以及可选的 CC Switch、Claude Code、Gemini CLI 和 JSONL 本地记录接入。新增供应商将按需启用，不增加独立嵌入式面板或强制云端账户。

## Nederlands

### Huidige versie: 1.3.0-beta.1 preview

Een Windows-desktopapp voor Codex-abonnementen, in het Chinees, Engels en Nederlands. Lokale gebruiksanalyse, accountlimieten, periodevergelijking, compacte weergave en optionele meldingen zijn beschikbaar. **Volledige Codex-functionaliteit van CodexBar en codex-usage is nog niet bereikt.** Zie het [overzicht](docs/COMPATIBILITY.md).

### Doel voor de volgende release: 1.4, compatibiliteit met Chinese codingplatforms

- Read-only connectors voor **Qwen Code, Kimi Code CLI en CodeBuddy Code**, gebaseerd op gedocumenteerde lokale gebruiks- of telemetriebronnen, zonder prompt- of antwoordtekst te verzamelen.
- Herken Chinese diensten via **Claude Code, CC Switch en OpenAI/Anthropic-compatibele gateways**, waaronder GLM Coding Plan en modelfamilies van Qwen, Kimi, MiniMax en DeepSeek. Bewaar aanbieder, abonnement en model in plaats van ze als `Other` te tonen.
- Normaliseer gewone invoer, cache lezen/schrijven, uitvoer en reasoning-tokens; toon de herkomst en voorkom dubbeltelling tussen proxy- en lokale logs.
- Toon abonnementslimieten alleen via een gedocumenteerde, door de gebruiker geautoriseerde interface. Toon anders lokale tokens en geschatte of bronbedragen zonder die als resterend tegoed of factuur te presenteren.
- Voeg detectie, compatibiliteitsstatus, fixtures en tests in drie talen toe. Een platform geldt pas als ondersteund nadat totalen, modeltoewijzing, deduplicatie, privacy en upgrades zijn getest.
- Zet tegelijk de migratie van de Codex-engine en taak-/agenttoewijzing voort binnen hetzelfde dashboard.

De eerste acceptatieset en bewijsniveaus staan in [compatibiliteit met Chinese platforms](docs/DOMESTIC-COMPATIBILITY.md). Gesloten IDE-producten zonder gedocumenteerde export, log of API blijven kandidaat.

De huidige scope omvat Codex-abonnementen en lokale records van CC Switch, Claude Code, Gemini CLI en JSONL. Extra aanbieders worden optioneel, zonder afzonderlijke ingebedde dashboards of verplicht cloudaccount.
