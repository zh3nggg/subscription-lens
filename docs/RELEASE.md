# Subscription Lens 1.6.5

Windows x64 stable release · 中文 / English / Nederlands

## Release boundary

- Codex usage sessions resolve conversation names from the local thread catalog when available; project names and short IDs remain visible as context, with a safe ID fallback.
- The provider overview combines connected sources in an all-source ledger and suppresses exact duplicate requests. Possible overlaps remain visible with provenance; selecting one source keeps a source-specific ledger.
- Provider and model rings use a distinct color palette with synchronized hover and keyboard focus between slices and legend entries.
- Average cost per 1M tokens, Tokens/cost switching, model drill-down, Qoder local records and Codex quota/model-mix features remain available.
- Costs are API-equivalent estimates or source-reported amounts, not invoices. Qoder Credits remain separate from USD. Regular ChatGPT conversations and other-device usage are not collected automatically.
- The Windows installer preserves the application identity, settings and local usage history during in-place upgrades. The build is unsigned and does not auto-update.

## 发布边界

- Codex 用量会话在可用时读取本机线程目录中的会话名称；项目名和短 ID 作为辅助信息保留，索引不可用时安全回退到 ID。
- 多供应商总览默认合并已连接来源，完全相同的请求只计一次；疑似重叠记录保留来源提示。选择单个来源时仍按该来源单独统计。
- 供应商和模型环形图使用区分度更高的配色，扇区与右侧图例支持悬停和键盘聚焦联动高亮。
- 平均每百万 Tokens 成本、Tokens／费用切换、模型下钻、Qoder 本地记录以及 Codex 额度／模型组合功能继续可用。
- 费用是 API 等价估算或来源报告值，不是账单；Qoder Credits 与美元分开。普通 ChatGPT 对话和其他设备用量不会自动采集。
- Windows 安装器支持原位覆盖升级并保留程序身份、设置和本机用量历史。安装包未签名，也不自动更新。

See [release notes](../RELEASE-NOTES.md), [source setup](PROVIDER-MONITORING.md), [validation](VALIDATION.md) and [third-party notices](../THIRD-PARTY-NOTICES.md).

Developed with assistance from **GPT-6 Astra**.






