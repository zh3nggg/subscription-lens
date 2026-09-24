# Subscription Lens 3.1.1

Windows x64 and Apple Silicon macOS stable release · 中文 / English / Nederlands

Subscription Lens 3.1.1 fixes the overview distribution chart so it follows the selected local or multi-device view. The chart and legend now aggregate synchronized device models and preserve unpriced usage rather than continuing to display local provider/model totals.

This release also includes the Tauri migration fixes and usage features from 3.1.0: Codex quota forecasts use fresh per-window timestamps; account authorization is shown separately from a successful quota query; R2 settings survive background refreshes; and CodeBuddy and Qoder usage collection is available in the Tauri app.

Multi-device snapshots retain calculated Codex API-equivalent costs even when a session record has no `pricing_model` label. Records without an available price remain unpriced rather than appearing as `$0.00`. After upgrading, run a bidirectional sync once on each device to regenerate its snapshot.

The Windows and Apple Silicon applications embed the original CC Switch provider manager and routing runtime. A separate CC Switch installation is not required. The macOS build requires macOS 13 or later, is ad-hoc signed rather than Apple-notarized, and stores R2 credentials in the login Keychain. Control-click the app and choose **Open** on first launch if macOS reports an unidentified developer.

The release contains an unsigned Windows NSIS installer, an Apple Silicon DMG and ZIP, and SHA256 manifests. It has no automatic updater. API-equivalent costs are estimates, not invoices; records without a matching price remain unpriced. Exact GPT-6 Astra, Sol and Luna identities use the bundled Standard price snapshot.

余量 3.1.1 修复总览扇形统计切换到多设备后仍显示本机供应商和模型分布的问题。图表和图例现在根据已同步设备的模型用量重新汇总，并保留未计价状态。

本版也包含 3.1.0 的 Tauri 迁移后修复：额度预测使用各窗口的最新查询时间；连接页区分授权状态和额度查询成功状态；后台刷新不会清空 R2 配置表单；Tauri 版支持 CodeBuddy 与 Qoder 用量采集。升级后请在每台设备上各执行一次双向同步，以重新生成设备快照。

Windows 与 Apple Silicon 应用均内嵌 CC Switch 原版供应商管理器与路由运行时，无需单独安装。macOS 版要求 macOS 13 或更高版本，使用 ad-hoc 签名而未经过 Apple 公证，并把 R2 凭据保存到登录钥匙串。首次启动若提示无法验证开发者，请在“应用程序”中按住 Control 点击并选择“打开”。

本发行版提供 Windows NSIS 安装包、Apple Silicon DMG/ZIP 与 SHA256 校验文件，没有自动更新器。API 等价成本是估算值，不是账单；没有匹配价格的记录保持未计价。GPT-6 Astra、Sol、Luna 使用精确模型身份和内置 Standard 价格快照。

Subscription Lens 3.1.1 herstelt de verdelinggrafiek in het overzicht: na het kiezen van meerdere apparaten toont de grafiek nu de gesynchroniseerde modellen en leveranciers, inclusief niet-geprijsd gebruik.

De release bevat ook de Tauri-migratiefixes uit 3.1.0: actuele quotatijdstempels, gescheiden autorisatie- en quotastatus, behoud van R2-instellingen tijdens verversen en CodeBuddy/Qoder-gebruiksregistratie. Voer na de upgrade op elk apparaat eenmaal een synchronisatie in beide richtingen uit.

De Windows- en Apple Silicon-apps bevatten de originele CC Switch-providerbeheerder en router-runtime. De macOS-build vereist macOS 13 of nieuwer, is ad-hoc ondertekend en bewaart R2-referenties in de inlogsleutelhanger. Control-klik bij de eerste start op de app en kies **Open** als macOS een onbekende ontwikkelaar meldt.

De release bevat een Windows NSIS-installer, Apple Silicon DMG/ZIP en SHA256-controlesommen. API-equivalente kosten zijn schattingen, geen facturen; modellen zonder prijs blijven ongeprijsd. GPT-6 Astra, Sol en Luna gebruiken exacte modelidentiteiten en de ingebouwde Standard-prijsmomentopname.
