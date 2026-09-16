# Subscription Lens 1.4.0-beta.6

Windows x64 · 中文 / English / Nederlands

## 新增功能

- 自动发现 Qwen Code、Kimi Code、CodeBuddy Code、CC Switch、Claude Code 与 Gemini CLI 的常用本机目录，可一键连接单个或全部已安装工具；特殊路径继续支持手动选择。
- Codex 总览新增模型组合建议：结合近 14 天模型使用比例、API 等价强度和当前额度预测，建议提高或降低各模型比例，使使用速度更接近窗口重置时间。
- 建议显示学习状态和可信度。OpenAI 未提供各模型的套餐额度精确换算权重，因此建议会随额度观测继续校准，不承诺精确耗尽额度。
- 模型建议在小窗口中作为独立标签，在高窗口中与趋势和项目并列，保持总览无整页滚动。
- 保留供应商 → 模型环形图、多来源明细与性能、自定义计价、套餐实付对比、专注窗口和三语言支持。
- 新安装包沿用原安装身份与目录，原位替换旧版并保留设置和用量。

## What's new

Standard local installations of six supported tools are now detected and connected in one click. The Codex overview adds a confidence-labelled model-mix recommendation based on 14-day habits, API-equivalent intensity and live quota pace. It targets the next reset but remains adaptive because exact per-model subscription quota weights are not published.

## Nieuw

Zes ondersteunde tools in standaardmappen worden nu automatisch gevonden en met één klik verbonden. Het Codex-overzicht adviseert een modelmix op basis van 14 dagen gebruik, API-equivalente intensiteit en het actuele quotatempo, met een zichtbare betrouwbaarheid. Het advies richt zich op de volgende reset en blijft adaptief omdat exacte quotagewichten per model niet zijn gepubliceerd.

## Scope

- Local sources are optional and read-only. Automatic discovery checks known local paths only and never reads credentials. Select one source at a time in analytics to avoid double-counting overlapping CLI/proxy records.
- Model-mix advice uses observed habits, API-equivalent intensity and quota pace. It is an experiment to calibrate over later windows, not an official quota conversion or guarantee.
- CC Switch amounts are stored estimates. Source-reported amounts are not independently verified invoices. Direct billing APIs, provider balances, proxy routing and credential switching are not included.
- The existing Codex collector still has incomplete support for modern request/compaction counters and fork histories. The vendored codex-usage engine remains experimental and inactive.
- Unsigned Windows build. In-place installer upgrades are supported by the packaging configuration; a clean-VM upgrade has not been certified. No background automatic downloading is included.
- Keep the latest verified stable and preview locally. Until a stable release exists, the previous preview is retained as the rollback copy.

See [source setup](https://github.com/zh3nggg/subscription-lens/blob/main/docs/PROVIDER-MONITORING.md), [validation](https://github.com/zh3nggg/subscription-lens/blob/main/docs/VALIDATION.md) and [third-party notices](https://github.com/zh3nggg/subscription-lens/blob/main/THIRD-PARTY-NOTICES.md).

Developed with assistance from **GPT-6 Astra**. CodexBar and CC Switch are references; MIT-licensed codex-usage source is retained with its notices.
