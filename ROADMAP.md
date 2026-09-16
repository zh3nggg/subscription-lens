# Roadmap

[English](#english) · [简体中文](#简体中文) · [Nederlands](#nederlands)

## English

### Current release: 1.3.0-beta.1 preview

Windows desktop app for Codex subscriptions, with Chinese, English and Dutch UI. Local usage analytics, account quota, billing comparison, compact view and optional notifications are available. Full Codex feature parity with CodexBar and codex-usage is **not yet complete**. See [coverage](docs/COMPATIBILITY.md).

### Next update

- Integrate the pinned codex-usage accounting engine: independent request and compaction usage, mixed legacy counters, deduplication and safe ledger migration.
- Bring task trees, agent attribution, Fast mode metadata and hourly analysis into the existing usage views.
- Improve Codex account credits, account switching, service status and release updates, subject to available account interfaces.
- **Other providers:** local Claude Code, Gemini CLI and CC Switch records are available. Official billing APIs, more clients and invoice reconciliation remain planned without a delivery date.

Current scope includes Codex subscriptions and optional local provider records (CC Switch, Claude Code, Gemini CLI and JSONL). New providers will be optional. No separate embedded dashboards or mandatory cloud account are planned.

## 简体中文

### 当前版本：1.3.0-beta.1 预发布

面向 Codex 套餐的 Windows 桌面应用，支持中文、英语、荷兰语。已提供本地用量分析、账户额度、账期对比、专注窗口和可选提醒。**尚未完整覆盖 CodexBar 与 codex-usage 的 Codex 功能**，详见[覆盖清单](docs/COMPATIBILITY.md)。

### 下一次版本更新前瞻

- 接入固定版本的 codex-usage 统计引擎，完善独立请求、压缩用量、混合旧计数、去重及安全账本迁移。
- 将任务树、代理归属、Fast 模式信息、小时分析融入现有用量页面。
- 根据可用账户接口完善 Codex 额度余额、多账户切换、服务状态及软件更新。
- **其他供应商支持：**已接入 Claude Code、Gemini CLI 和 CC Switch 本地用量。后续扩展官方账单接口、更多客户端和账单核对；具体日期未定。

当前已包含 Codex 套餐，以及可选的 CC Switch、Claude Code、Gemini CLI 和 JSONL 本地记录接入。新增供应商将按需启用，不增加独立嵌入式面板或强制云端账户。

## Nederlands

### Huidige versie: 1.3.0-beta.1 preview

Een Windows-desktopapp voor Codex-abonnementen, in het Chinees, Engels en Nederlands. Lokale gebruiksanalyse, accountlimieten, periodevergelijking, compacte weergave en optionele meldingen zijn beschikbaar. **Volledige Codex-functionaliteit van CodexBar en codex-usage is nog niet bereikt.** Zie het [overzicht](docs/COMPATIBILITY.md).

### Vooruitblik op de volgende update

- De vastgelegde codex-usage-engine integreren, inclusief verzoeken, compactieverbruik, oudere tellers, deduplicatie en veilige gegevensmigratie.
- Taakbomen, agenttypen, Fast-metadata en analyse per uur opnemen in de bestaande gebruiksweergaven.
- Codex-tegoeden, accountselectie, servicestatus en software-updates verbeteren waar accountinterfaces dat toelaten.
- **Andere aanbieders:** lokale records van Claude Code, Gemini CLI en CC Switch zijn beschikbaar. Officiële factuurinterfaces, extra clients en factuurcontrole blijven gepland zonder vaste datum.

De huidige scope omvat Codex-abonnementen en lokale records van CC Switch, Claude Code, Gemini CLI en JSONL. Extra aanbieders worden optioneel, zonder afzonderlijke ingebedde dashboards of verplicht cloudaccount.
