# Subscription Lens 3.1.0

Windows x64 stable release · 中文 / English / Nederlands

Subscription Lens 3.1.0 consolidates the fixes and usage features added after the Tauri migration. Codex quota forecasts now use fresh per-window timestamps; account authorization is shown separately from a successful quota query; R2 settings survive background refreshes; and CodeBuddy and Qoder usage collection is available in the Tauri app.

Multi-device snapshots now retain calculated Codex API-equivalent costs even when a session record has no `pricing_model` label. Records without an available price remain unpriced rather than appearing as `$0.00`. The overview's multi-device tab and the Devices page use the same corrected aggregation. After upgrading, run a bidirectional sync once on each device to regenerate its snapshot.

The Windows application embeds the original CC Switch provider manager and routing runtime. A separate CC Switch installation is not required. The first reliably usable multi-provider release was 3.0.0; Subscription Lens continues to use its own monitoring layout and charts.

The release contains an unsigned NSIS installer and a SHA256 checksum. It has no automatic updater. Back up application data before upgrading from Electron if you need an easy rollback. API-equivalent costs are estimates, not invoices. Records without a matching price remain unpriced. The Apple Silicon macOS `3.0.0-beta.2` build remains an Electron preview and is not part of this release.

余量 3.1.0 汇总了 Tauri 迁移后的修复与用量功能：额度预测使用各窗口的最新查询时间；连接页区分授权状态和额度查询成功状态；后台刷新不会清空 R2 配置表单；Tauri 版支持 CodeBuddy 与 Qoder 用量采集。

多设备快照现在会保留已计算的 Codex API 等价成本，即使会话记录没有 `pricing_model` 标签。没有可用价格的数据仍标记为未计价，不再误显示为 `US$0.00`。总览多设备 tab 与设备页使用同一汇总逻辑。升级后请在每台设备上各执行一次双向同步，以重新生成设备快照。

Windows 应用内嵌 CC Switch 原版供应商管理器与路由运行时，无需单独安装 CC Switch。首个真正稳定可用的多供应商版本为 3.0.0；Subscription Lens 继续使用自己的统计界面与图表。

本发行版提供未签名的 NSIS 安装包与 SHA256 校验文件，没有自动更新器。从 Electron 版升级前，如需方便回退，请先备份应用数据。API 等价成本是估算值，不是账单；没有匹配价格的记录会保持未计价。Apple Silicon macOS `3.0.0-beta.2` 仍为 Electron 预览版，不属于本次发行。

De release bevat een niet-ondertekende NSIS-installer en een SHA256-controlesom. Er is geen automatische updater. Maak vóór een upgrade vanaf Electron een back-up als je eenvoudig wilt kunnen terugkeren. API-equivalente kosten zijn schattingen, geen facturen. Records zonder bekende prijs blijven ongeprijsd. De Apple Silicon macOS `3.0.0-beta.2`-build blijft een Electron-preview en maakt geen deel uit van deze release.
