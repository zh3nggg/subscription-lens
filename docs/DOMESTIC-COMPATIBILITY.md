# 1.5 国产 Agent 兼容目标

本文件定义 1.4 系列的验收边界。名单会随官方接口变化调整。

## 首批范围

| 接入对象 | 目标方式 | 1.4 验收要求 |
| --- | --- | --- |
| Qwen Code | 只读解析 `usage/token-usage-YYYY-MM.jsonl` | 已接入每请求模型、Tokens、缓存、推理与 API 时长；后续补本地 OTLP 接收器 |
| Kimi Code CLI | 只读解析 `KIMI_CODE_HOME` 下主代理与子代理的 `usage.record` | 已接入 per-turn 增量，跳过 session 累计行；后续补旧版 Kimi CLI |
| CodeBuddy Code | 只读解析 `~/.codebuddy/projects` 中带用量的消息与工具调用 | 已接入 cache hit/miss 和包含缓存的回退口径；套餐 credit 暂不换算金额 |
| GLM Coding Plan | 复用 Claude Code 连接器并根据可验证端点／模型标识归属到智谱 | 不把 GLM 请求显示为 Anthropic；缓存口径和重复消息处理一致 |
| 通义／Kimi／MiniMax／DeepSeek 等兼容 API | CC Switch 或 Subscription Lens JSONL／未来本地 OTLP 接收器 | 保留实际供应商和模型；支持自定义价格及来源报告费用；不读取 API Key |

## 1.5 候选与证据分级

| 平台 | 当前可行路径 | 支持边界 |
| --- | --- | --- |
| CodeBuddy Code | 现有 `.codebuddy/projects` 只读连接器 | 已支持；继续覆盖新记录格式与重复事件更新。 |
| Qoder | 官方 CLI stream JSON（通过内置捕获脚本）或用户导出的 usage JSON | 已接入本地 Assistant usage；跳过累计 `result`，保留 Credits 原单位。账户额度仍需用户在 Qoder 内查看，不读取凭据。 |
| TRAE | 用户导出的 JSONL、兼容网关或未来官方本地遥测 | IDE 本地目录尚无稳定公开用量格式，暂不宣称自动读取。 |
| Cursor | 用户导出的用量数据、兼容网关或未来官方接口 | 仅凭 IDE 缓存无法可靠还原请求与 Tokens，暂不自动扫描。 |
| DeepSeek | CC Switch、兼容网关或 Subscription Lens JSONL | 已支持供应商／模型归属；直接账户余额与账单接口另需官方授权。 |

灵码等 IDE 或插件继续列为候选。只有在存在官方本地导出、稳定日志、CLI 结构化输出或经用户授权的用量接口后，才进入已承诺范围。

## 统一用户体验

所有连接器继续使用现有的“连接、概览、用量、价格”页面：自动发现只给出建议，添加来源仍由用户确认；每个来源可暂停、重新扫描并查看最近错误。供应商环形图下钻到模型，模型继续进入请求明细。筛选、CSV、费用口径和三语言行为保持一致。

记录必须标明以下证据等级：

1. **本地实测**：客户端或服务返回的 Tokens。
2. **来源金额**：上游日志报告的费用或 credit，保留原单位和来源。
3. **本地估算**：依据用户选择的价格规则计算。
4. **未知**：缺少可靠字段时保持未知，不显示为零。

套餐额度、API 余额和本地 Tokens 不得混加。Credits 只有在官方定义换算规则时才转换为金额。代理与客户端记录可能描述同一次请求，默认按单一来源统计；跨来源合并需要稳定请求标识和去重测试。仪表盘不会把不同来源自动相加，用户切换来源后才查看对应账本。

## 隐私与安全

- 连接器只读打开用户选择的目录、文件或本地遥测端点。
- 不读取配置中的 API Key、OAuth token、Cookie 或供应商密钥字段。
- 不保存提示词、回复、工具参数或代码正文。若上游遥测可能包含这些字段，界面必须提醒并默认拒绝采集。
- 平台识别来自经过清理的模型／端点元数据；不把未知第三方中转站强行归属于某品牌。

## 发布门槛

每个“已支持”平台至少需要：官方格式依据、脱敏合成样本、增量读取和重复更新测试、Tokens 分类核对、模型归属测试、异常／半行恢复、三语言 UI、窄窗口布局、升级后账本保留。无法验证官方账单时，产品只宣称“用量监控与费用估算”。

## 官方依据

- [Qwen Code OpenTelemetry](https://qwenlm.github.io/qwen-code-docs/zh/developers/development/telemetry/)：支持本地文件或 OTLP 输出，并记录模型、Tokens、延迟和状态等观测字段。
- [Qwen Code 配置](https://qwenlm.github.io/qwen-code-docs/zh/users/configuration/settings/)：说明 `QWEN_HOME`、运行目录、遥测出口及敏感字段开关。
- [Kimi Code CLI 入门](https://www.kimi.com/code/docs/en/kimi-code-cli/guides/getting-started)：说明 `KIMI_CODE_HOME`、本地会话目录及多供应商能力；[/usage 命令](https://www.kimi.com/code/docs/en/kimi-code-cli/reference/slash-commands.html)提供会话用量与额度视图。
- [Kimi Code token counting](https://www.kimi.com/code/docs/en/kimi-code-cli/configuration/config-files)：区分服务实测与客户端估算 Tokens。
- [GLM Coding Plan × Claude Code](https://docs.bigmodel.cn/cn/guide/develop/claude)：官方说明通过 Claude Code 使用 GLM Coding Plan。
- [CodeBuddy Code 终端版](https://cloud.tencent.com/document/product/1039/131814)：提供 `/cost` 会话成本入口；[`.codebuddy` 目录说明](https://cloud.tencent.com/document/product/1831/137016)用于评估可读取的本地记录边界。

## English summary

Version 1.5 targets evidence-gated read-only connectors for TRAE, CodeBuddy Code and Qoder, plus explicit import paths for Cursor and DeepSeek. Support requires documented data, privacy-safe fixtures, verified token semantics and deduplication. Closed IDEs without a stable export remain candidates. Subscription quota, credits, reported API cost and local estimates stay separate.

## Nederlandse samenvatting

Versie 1.5 richt zich op connectors met verifieerbare gegevens voor TRAE, CodeBuddy Code en Qoder, plus expliciete importpaden voor Cursor en DeepSeek. Ondersteuning vereist gedocumenteerde gegevens, privacyveilige fixtures, geteste tokenregels en deduplicatie. Gesloten IDE's zonder stabiele export blijven kandidaat. Abonnementslimieten, credits, bronkosten en lokale schattingen blijven gescheiden.
