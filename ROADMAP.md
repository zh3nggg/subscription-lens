# Roadmap

[English](#english) · [简体中文](#简体中文) · [Nederlands](#nederlands)

## English

### Current release: 1.4.2 stable

Windows desktop app for Codex subscriptions, with Chinese, English and Dutch UI. Local usage analytics, account quota, billing comparison, compact view and optional notifications are available. Full Codex feature parity with CodexBar and codex-usage is **not yet complete**. See [coverage](docs/COMPATIBILITY.md).

### Next track: 1.5 domestic agent compatibility and billing deduplication

- Extend first-class, read-only connectors to **TRAE, CodeBuddy Code and Qoder** where a documented local usage or SDK surface exists. **Cursor** and the TRAE IDE remain compatibility candidates until a stable export or log format is available; manual JSONL or gateway imports remain supported.
- Recognize **DeepSeek** and other domestic services through CC Switch, compatible gateways and explicit usage exports. Preserve the actual provider, plan and model instead of grouping them under `Other` or the client application.
- Normalize token semantics across clients: fresh input, cache read/write, output and reasoning; expose record provenance and avoid adding overlapping proxy and local logs together.
- Add overlap detection and a visible source boundary. The dashboard must never sum two sources that may describe the same request; cross-source merging requires a stable event ID, provenance and a dedicated deduplication fixture.
- Support subscription quota/credits only where a documented, user-authorized interface exists. Otherwise show local tokens and estimated/API-reported cost without presenting them as remaining plan quota or an invoice.
- Add connector detection, a compatibility status page, fixtures and three-language tests. A platform is marked supported only after token totals, model attribution, deduplication, privacy and upgrade behavior pass its acceptance fixture.
- Continue the active Codex accounting migration and task/agent attribution work without creating a second dashboard.

The initial acceptance set and evidence levels are tracked in [Domestic platform compatibility](docs/DOMESTIC-COMPATIBILITY.md). IDE-only products without a documented local export, log or API remain candidates rather than promised support.

Current scope includes Codex subscriptions and optional local records from Qwen Code, Kimi Code, CodeBuddy Code, Qoder, CC Switch, Claude Code, Gemini CLI and JSONL. Qoder Credits are retained in their native unit and never added to API-equivalent USD. The 1.5 track extends evidence-gated domestic agent compatibility; unsupported IDE-only formats remain candidates.

## 简体中文

### 当前版本：1.4.2 正式版

面向 Codex 套餐的 Windows 桌面应用，支持中文、英语、荷兰语。已提供本地用量分析、账户额度、账期对比、专注窗口和可选提醒。**尚未完整覆盖 CodexBar 与 codex-usage 的 Codex 功能**，详见[覆盖清单](docs/COMPATIBILITY.md)。

### 下一版本主线：国产 Agent 兼容与去重计费

- 在有公开格式依据时加入 **TRAE、CodeBuddy Code、Qoder** 的只读连接器；**Cursor** 与 TRAE IDE 在获得稳定导出或日志格式前保持候选状态，继续支持手动 JSONL／网关导入。
- 通过 CC Switch、兼容网关和明确的用量导出识别 **DeepSeek** 等国产服务；保留真实供应商、套餐和模型，不再笼统归入 `Other` 或客户端名称。
- 统一普通输入、缓存读写、输出和推理 Tokens 的口径；每条记录显示来源，并避免把代理日志与本地日志重复相加。
- 增加来源边界和重叠检测：可能描述同一请求的两个来源不得直接相加；跨来源合并必须有稳定事件 ID、来源链路和专门去重样本。
- 只有存在官方、经用户授权的接口时才显示套餐额度或积分；其余情况仅展示本地 Tokens 和估算／来源报告费用，不冒充剩余额度或实际账单。
- 增加自动发现、兼容状态页、合成样本和三语言测试。只有 Tokens、模型归属、去重、隐私与升级行为均通过验收的版本，才标记为已支持。
- 同时继续完成 Codex 统计引擎迁移和任务／代理归属，不另建第二套监控面板。

首批验收范围和证据级别见[国产平台兼容目标](docs/DOMESTIC-COMPATIBILITY.md)。仅有封闭 IDE、没有公开本地导出／日志／接口的平台先列为候选，不提前承诺支持。

当前已包含 Codex 套餐，以及可选的 Qwen Code、Kimi Code、CodeBuddy Code、Qoder、CC Switch、Claude Code、Gemini CLI 和 JSONL 本地记录接入。Qoder Credits 保留原单位，不与 API 等价美元相加。1.5 版本按证据等级扩展国产 Agent；没有稳定格式的 IDE 暂不标记为已支持。

## Nederlands

### Huidige versie: 1.4.2 stabiel

Een Windows-desktopapp voor Codex-abonnementen, in het Chinees, Engels en Nederlands. Lokale gebruiksanalyse, accountlimieten, periodevergelijking, compacte weergave en optionele meldingen zijn beschikbaar. **Volledige Codex-functionaliteit van CodexBar en codex-usage is nog niet bereikt.** Zie het [overzicht](docs/COMPATIBILITY.md).

### Volgende lijn: compatibiliteit met binnenlandse agents en deduplicatie

- Voeg read-only connectors toe voor **TRAE, CodeBuddy Code en Qoder** zodra een gedocumenteerde lokale bron beschikbaar is. **Cursor** en de TRAE IDE blijven kandidaat zolang een stabiele export of log ontbreekt; handmatige JSONL- of gateway-import blijft mogelijk.
- Herken **DeepSeek** en andere Chinese diensten via CC Switch, compatibele gateways en expliciete gebruiksexports. Bewaar aanbieder, abonnement en model in plaats van ze als `Other` te tonen.
- Normaliseer gewone invoer, cache lezen/schrijven, uitvoer en reasoning-tokens; toon de herkomst en voorkom dubbeltelling tussen proxy- en lokale logs.
- Toon een duidelijke bronafbakening en detecteer overlap; bronnen die dezelfde aanvraag kunnen beschrijven worden niet automatisch opgeteld. Samenvoegen vereist een stabiele event-ID, provenance en een deduplicatietest.
- Toon abonnementslimieten alleen via een gedocumenteerde, door de gebruiker geautoriseerde interface. Toon anders lokale tokens en geschatte of bronbedragen zonder die als resterend tegoed of factuur te presenteren.
- Voeg detectie, compatibiliteitsstatus, fixtures en tests in drie talen toe. Een platform geldt pas als ondersteund nadat totalen, modeltoewijzing, deduplicatie, privacy en upgrades zijn getest.
- Zet tegelijk de migratie van de Codex-engine en taak-/agenttoewijzing voort binnen hetzelfde dashboard.

De eerste acceptatieset en bewijsniveaus staan in [compatibiliteit met Chinese platforms](docs/DOMESTIC-COMPATIBILITY.md). Gesloten IDE-producten zonder gedocumenteerde export, log of API blijven kandidaat.

De huidige scope omvat Codex-abonnementen en lokale records van Qwen Code, Kimi Code, CodeBuddy Code, Qoder, CC Switch, Claude Code, Gemini CLI en JSONL. Qoder Credits blijven in de oorspronkelijke eenheid en worden niet opgeteld bij API-equivalente USD. Versie 1.5 breidt dit uit volgens bewijsniveau; IDE-formaten zonder stabiele bron blijven kandidaat.
