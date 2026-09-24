# 余量 · Subscription Lens

面向 Windows 与 Apple Silicon Mac 上 **Codex 套餐用户**的桌面应用：查看还剩多少额度、哪些项目消耗了 Tokens，并推荐一套能将额度用到下次重置前的模型使用配比；同时比较已记录用量按 API 价格估算后与套餐实付的差额。本地统计无需 API Key；使用第三方路由时需提供所选供应商的凭据。

[English](../README.md) · [简体中文](README.zh-CN.md) · [Nederlands](README.nl.md)

> **3.0.0：首个真正稳定可用的多供应商版本。** Windows x64 版已迁移到 Tauri，并内嵌固定版本的 CC Switch 原版供应商管理器和原生路由运行时，无需单独安装 CC Switch。此前公开版本使用 Electron；Apple Silicon macOS 目前仍为 Electron 架构的 `3.0.0-beta.2` 预览版。

## 主要功能

| 使用需求 | 对应功能 |
| --- | --- |
| 了解还能用多久 | 查看账户额度、重置倒计时；观测充足时提供基于近期使用速度的估算。 |
| 弄清 Tokens 用在哪里 | 按项目、模型和会话查看已记录用量，逐层进入具体记录。 |
| 规划模型使用配比 | 根据当前额度窗口的模型历史和平均速度，推荐下次重置前的模型比例、各模型应增减的方向及建议可信度。 |
| 比较用量价值与套餐实付 | 将 API 等价成本与当期实际付款并列展示，支持自动月度账期。 |
| 工作时随手看额度 | 使用可置顶专注窗口、托盘和可选额度提醒，支持免打扰时段。 |
| 区分多台设备 | 当前未发布的 Windows Tauri 源码支持通过 Cloudflare R2 同步每台设备的脱敏统计快照；不上传原始日志、正文或项目路径。 |
| 导出明细或分享汇总 | 导出 CSV，或生成不含项目名和账户标识的 HTML 汇总报告。 |

## 1.5 多供应商监控

连接 Qwen Code、Kimi Code、CodeBuddy Code、Qoder、CC Switch、Claude Code、Gemini CLI 或自己的 API 用量文件。Windows 下 Qoder Quest 会读取本机 IDE agent 日志中的上下文快照，并明确标为 Tokens 估算；原始 Credits 与 API 等价美元分开统计。Qoder 也可通过内置脚本捕获 stream JSON，并跳过累计结果，避免重复计费。国产模型会在同一供应商 → 模型环形图中归属到阿里云、月之暗面、智谱、MiniMax、DeepSeek；支持 Tokens／费用切换、请求明细、性能与自定义计价。程序会自动发现常用目录中的已安装工具，可一次连接全部来源；特殊安装位置仍可手动选择。[来源配置与费用口径](PROVIDER-MONITORING.md)。

Tauri 3.x 版目前原生采集 CodeBuddy Code 与 Qoder；上方列出的其他来源仍由 Electron 版提供，尚未接入 Tauri。

当前未发布的 Windows Tauri 源码另提供可选 R2 多设备同步。可在应用内创建专用 bucket，或指定已有 bucket；Sublens 在 bucket 前缀（R2 的逻辑文件夹）下为每台设备维护一个 JSON 快照。Access Key 保存在 Windows 凭据管理器中。快照只含哈希化记录/会话标识、时间、模型、Token 分类和可用计价，不含源日志、聊天正文、项目路径、API Key 或登录凭据。应用启动时及运行期间每 5 分钟自动双向同步；多设备视图展示各快照汇总，因此可能延迟最多 5 分钟。

供应商和模型饼图还会显示所选时间段的平均每百万 Tokens 成本。分母只包含已计价 Tokens；未计价用量仍会显示，但不会被纳入平均值。

### 3.0.0：Codex 供应商路由

Windows 3.0.0 的“路由”页面直接打开内嵌的 CC Switch 原版供应商管理器。新增和编辑供应商、高级选项、模型映射、连接测试、切换，以及 OpenAI Official 的独立授权，均通过 CC Switch 自己的界面、命令和数据库完成。本机代理接管、恢复、回滚及 Responses／Chat 协议转换也沿用其原有实现；任务和回复仍在 Codex GUI／CLI 中进行。切换供应商后，已打开的 Codex 会话可能保留旧模型或认证状态，请新建会话使用新路由。

Codex 总览会结合当前额度窗口内的模型历史与平均额度速度，推荐下个重置前的模型使用比例，并标注可信度。由于 OpenAI 未公布各模型对应套餐额度的精确权重，该建议使用 API 等价强度持续校准，不承诺精确耗尽额度。

### CC Switch 版权与来源

Windows 3.0.0 复用了 [CC Switch](https://github.com/farion1231/cc-switch) 的原版供应商管理界面，以及供应商配置、OAuth、代理接管、恢复和协议转换等原生运行时，固定使用提交 `06082e189d65e6d6dbadc35dacdac1ce6c79d89a`。这些组件继续遵循 MIT 许可；版权所有 © 2025 Jason Young。发行包附带上游许可和[第三方开源说明](../THIRD-PARTY-NOTICES.md)。双方项目没有隶属关系。

![Subscription Lens 中文多供应商总览](images/providers.zh-CN.png)

*界面截图使用合成数据，不含真实账户或对话信息。*

## 下载与快速开始

**Windows 3.0.0 · x64。** 这是首个供应商管理与切换流程真正稳定可用的多供应商版本。下载 [Windows 3.0.0](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.0.0)：常规安装使用 `Subscription-Lens-3.0.0-installer-x64.exe`；便携版使用 `Subscription-Lens-3.0.0-x64.zip`。两者都内嵌 CC Switch。升级前请关闭旧程序；从 Electron 改为 Tauri，建议备份原有数据，需要方便回退时安装到独立目录。

**macOS Apple Silicon：** 以下 `3.0.0-beta.2` 仍为 Electron 预览版，与 Windows 3.0.0 的 Tauri 运行时不同。

**3.0.0-beta.2 预览版 · macOS Apple Silicon。** 需要 M 系列 Mac 与 macOS 13 或更高版本。当前采集器尚未完整适配所有客户端记录格式，汇总可能偏高或偏低；费用是估算值，不是账单或保证节省的金额。暂不支持自动更新。

[下载 3.0.0-beta.2](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.0.0-beta.2)

### 在 macOS 上安装

1. 下载 `Subscription-Lens-3.0.0-beta.2-arm64.dmg`，打开后将 **Subscription Lens** 拖入“应用程序”。ZIP 中是同一个应用，适合希望直接解压使用的用户。
2. 本预览版使用本机临时签名，尚未经过 Apple 公证，因此 macOS 可能提示“无法验证开发者”。请在“应用程序”中按住 Control 点击 **Subscription Lens**，选择“打开”，然后再次确认“打开”；通常只需在首次启动时确认一次。
3. 如果仍被阻止，请打开“系统设置 → 隐私与安全性”，向下找到 Subscription Lens 的安全提示，点击“仍要打开”，完成认证后再次确认。不要全局关闭 Gatekeeper。
4. 打开前可使用同一 Release 中的 `SHA256SUMS.txt` 核对下载文件。

**Windows 用户：**请使用上方的 [3.0.0 正式版](https://github.com/zh3nggg/subscription-lens/releases/tag/v3.0.0)。

1. 首次打开点击“开始监测”；自定义 Codex Home 可点“选择目录”。目录应包含 `sessions` 或 `archived_sessions`。
2. 在“连接”中点击“连接账户”。应用使用本机 Codex 的官方登录；未登录时按按钮打开浏览器登录。
3. 在“设置”中填写账期起止、套餐实付与额外额度（USD）。结束日期不含当天；可选手动日期或按续费日自动滚动。
4. 托盘运行、开机启动、深浅主题均在“设置”中配置。
5. 在“设置 → 语言”选择简体中文、English 或 Nederlands，点击“保存”立即应用。默认跟随系统，其他系统语言使用英语；重启后保留选择。

主工作台从 760×560 窗口起即可完整使用。Codex 首屏同时显示套餐状态、账期对比和供应商／模型分布；中等窗口用标签收纳趋势和项目，高窗口会自动展开更多内容，并保留当前来源和时间范围。

不需要 API Key、Node、Python 或 Docker。查询账户额度需要本机安装 Codex；找不到程序时可手动选择 Codex 可执行程序（Windows 为 `codex.exe`，macOS 通常为 `codex`）。仅查看本地 Token 明细不依赖账户查询。

<details>
<summary>使用细节与快捷键</summary>

- **工作前看额度。** 首页优先显示账户余量与距重置时间。预测至少需要同一账户、同一窗口、同一重置周期的 3 次观测、15 分钟及可测量变化；会使用当前额度窗口内已保留的全部观测，按整个窗口的平均速度推算，不再局限于最近两小时。超过三分钟的旧数据、重置或计数回退不会沿用旧预测。预测假设本窗口平均速度持续，不是保证；不会用本机 Tokens 猜套餐额度。
- **工作中用专注窗口。** Ctrl+Shift+M 切换小窗口，可选置顶；Esc 返回。启用托盘后单击托盘图标打开小窗口。
- **按需开启额度提醒。** 剩余20%、5%及观测到额度恢复时提醒；同一账户窗口去重。默认免打扰为本地22:00–08:00。需保持应用运行，操作系统的通知设置可能抑制系统提示。
- **工作后定位任务。** 点击项目或图表日期进入会话，按费用或最近活动排序，再查看具体记录。Ctrl+K 搜索。子任务标记只表示关系，其费用仅为本任务用量，不重复合入父任务。
- **续费日自动滚动。** 设置每月续费日，短月份使用最后一天而不改变原续费日。套餐实付按月沿用；额外实付仅用于当期。旧用户默认保留手动账期，需主动开启自动续期。
- **核对数据质量。** 查看未计价原因、解析异常、价格日期，并直接进入对应明细或来源。计价覆盖率不等于账户历史完整率；对比时段为前一等长连续区间，不是月末预测。
- **分享匿名摘要。** 预览后保存独立 HTML 文件，仅含汇总、计价覆盖率和日期，不含账户、项目名、路径或会话标识；不会自动上传。

额度观测只在本机保存：额度窗口有效期间保留，重置后再保留两天，最多 25,000 条。新功能未增加运行依赖、云服务或模型调用。

</details>

## 数据与费用口径

- 使用记录只读；保存时间、模型、项目名、Token 与来源元数据，不保存聊天正文，不直接读取认证文件。
- 每 15 秒检查新增记录。已连接账户默认每 60 秒查询额度；账户 Token 汇总约每 10 分钟更新。
- 同一记录重复扫描或归档不会重复入账。原记录被删除后，已经采集到的历史仍保留。
- API 等价成本按价格页 **2026-09-16 的 Standard 价格快照**重估已采集用量，包含输入、缓存与输出；推理 Token 已含在输出时不重复收费。
- 此数值不是实际账单。不匹配 Fast/Batch、地区附加费或工具调用费用；不是按事件发生时的历史价格结算。
- “价格”页可导出 JSON 模板、编辑后导入；导入会重估已有记录。未识别模型或缺少价格的记录显示未计价。内置价格不会悄悄在线变化。
- 本机明细和账户汇总分别展示；不把两者相加。多设备汇总只含用户主动同步的 Sublens 快照。不保证覆盖云端任务、普通 ChatGPT 网页或手机聊天。
- 本机历史按设备目录汇总，不自动把历史记录归属于当前登录账户。共享电脑或切换套餐账户时，请只添加属于自己的记录目录。
- 实付留空时不计算套餐差额；无模型明细的账户 Token 汇总不用于估价。

## 本地存储

Windows 默认保存于 `%APPDATA%\Subscription Lens`，macOS 默认保存于 `~/Library/Application Support/Subscription Lens`，包含本应用的 SQLite 账本及设置。移除应用默认保留此数据。不会删除或改写 Codex 记录。

高级部署可设置 `LENS_DATA_DIR` 指向自己的数据目录；便携 ZIP 默认仍使用标准用户数据目录。不要把同一正在运行的数据库放在同步盘上供多设备同时写入。

## 常见问题

- **未找到 Codex**：安装官方 Codex，或在“连接”页选择已有的 Codex 可执行程序。
- **未登录**：点击“登录 ChatGPT”。登录由官方 Codex 管理，本应用不要求粘贴 Cookie 或令牌。
- **历史快照**：未连接账户或最新查询不可用；显示记录中的最近额度。到达重置时间后显示待刷新。
- **断开**：只停止本应用查询，不退出你的 Codex 账户。
- **Token 已记录但未计价**：查看明细原因，必要时导入价格目录。不要用相似模型的价格代替未知模型。
- **价格变更**：从官方价格页核对，并通过“价格 → 导出/导入”维护目录。

## 当前范围与下一版计划

当前支持 Windows 与 Apple Silicon macOS 上的 Codex 套餐与多供应商本地记录；普通 ChatGPT 聊天和其他设备用量不自动采集。尚未完整覆盖 CodexBar 与 codex-usage 的 Codex 功能。

1.4 已加入 Qwen Code、Kimi Code、CodeBuddy Code 的只读连接器，并识别经 Claude Code、CC Switch 或兼容网关使用的 GLM、通义、Kimi、MiniMax、DeepSeek。旧版格式、套餐额度／积分接口及更多国产工具继续按[验收范围](DOMESTIC-COMPATIBILITY.md)推进。

[路线图](../ROADMAP.md#简体中文) · [功能覆盖清单](COMPATIBILITY.md) · [发布边界](RELEASE.md) · [验证报告](VALIDATION.md)

## 源码构建与参与贡献

Windows 3.0.0 的 Tauri 构建需要 Node.js 24、Rust 和 pnpm，并需初始化 CC Switch 子模块；构建脚本会编译内嵌的原版管理界面与 Rust 运行时。Apple Silicon macOS 的 Electron 预览版另需 Rust 1.95 与 Xcode Command Line Tools，用于编译内嵌 Router。界面测试、翻译维护及实验性统计引擎说明见[贡献指南](../CONTRIBUTING.md)。真实账户测试仅供手动运行。

```powershell
npm ci
npm test
git submodule update --init --recursive
cd native/cc-switch-runtime
pnpm install --frozen-lockfile
cd ../..
.\scripts\build-tauri-migration-host.ps1 -Action release
```

在 Apple Silicon Mac 上先执行 `git submodule update --init --recursive`，再运行 `npm run dist`，会生成本机临时签名的 arm64 DMG 与 ZIP；Windows 仍生成现有的 x64 NSIS 与 ZIP。

## 开发与致谢

本项目在 **GPT-6 Astra** 的协助下完成开发。

[CodexBar](https://github.com/steipete/CodexBar) 为额度和桌面交互设计提供参考；项目已引入采用 MIT 许可的 [codex-usage](https://github.com/zJay26/codex-usage) 源码，用于下一步统计引擎整合，保留其许可与致谢，后续用于统计引擎整合。

本项目采用 MIT 许可，相关来源和版权见[开源说明](../THIRD-PARTY-NOTICES.md)。这是独立项目，与 OpenAI 无隶属关系，也未获得上述项目的背书。
