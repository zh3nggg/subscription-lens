# Subscription Lens 3.0.0-beta.2

Apple Silicon macOS preview release · 中文 / English / Nederlands

3.0.0-beta.2 adds an Apple Silicon macOS build to the new-generation Electron preview after the 1.6.x stable line. It embeds the CC Switch-compatible routing runtime and is not a Tauri migration. Keep 1.6.5 available as the stable fallback while evaluating the preview. Windows x64 users remain on 3.0.0-beta.1 for this release.

## Release boundary

- Codex usage sessions resolve conversation names from the local thread catalog when available; project names and short IDs remain visible as context, with a safe ID fallback.
- The provider overview combines connected sources in an all-source ledger and suppresses exact duplicate requests. Possible overlaps remain visible with provenance; selecting one source keeps a source-specific ledger.
- Provider and model rings use a distinct color palette with synchronized hover and keyboard focus between slices and legend entries.
- Average cost per 1M tokens, Tokens/cost switching, model drill-down, Qoder local records and Codex quota/model-mix features remain available.
- Costs are API-equivalent estimates or source-reported amounts, not invoices. Qoder Credits remain separate from USD. Regular ChatGPT conversations and other-device usage are not collected automatically.
- The release includes ad-hoc-signed arm64 DMG and ZIP packages for M-series Macs running macOS 13 or later. It is not Apple-notarized and does not auto-update.
- The macOS app discovers Codex from PATH, ChatGPT.app or Codex.app, uses Keychain-backed Electron secure storage, and bundles the native arm64 CC Switch router.

## 发布边界

- Codex 用量会话在可用时读取本机线程目录中的会话名称；项目名和短 ID 作为辅助信息保留，索引不可用时安全回退到 ID。
- 多供应商总览默认合并已连接来源，完全相同的请求只计一次；疑似重叠记录保留来源提示。选择单个来源时仍按该来源单独统计。
- 供应商和模型环形图使用区分度更高的配色，扇区与右侧图例支持悬停和键盘聚焦联动高亮。
- 平均每百万 Tokens 成本、Tokens／费用切换、模型下钻、Qoder 本地记录以及 Codex 额度／模型组合功能继续可用。
- 费用是 API 等价估算或来源报告值，不是账单；Qoder Credits 与美元分开。普通 ChatGPT 对话和其他设备用量不会自动采集。
- 本版本为运行 macOS 13 或更高版本的 M 系列 Mac 提供本机临时签名的 arm64 DMG 与 ZIP；尚未经过 Apple 公证，也不自动更新。
- macOS 版可从 PATH、ChatGPT.app 或 Codex.app 自动发现 Codex，使用由钥匙串支持的 Electron 安全存储，并内嵌原生 arm64 CC Switch Router。

See [release notes](../RELEASE-NOTES.md), [source setup](PROVIDER-MONITORING.md), [validation](VALIDATION.md) and [third-party notices](../THIRD-PARTY-NOTICES.md).

Developed with assistance from **GPT-6 Astra**.





