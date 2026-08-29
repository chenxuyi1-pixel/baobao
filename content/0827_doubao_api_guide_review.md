# 豆包三接口接入指南核对结论

## 文本对话

项目已在服务端封装 `/api/chat`，前端不会接触 Ark Key。当前配置继续使用用户提供的 Agent Plan Base URL；实际请求前已完成：

- 最近历史限制为 6 条消息；
- `max_tokens` 限制为 200；
- 四角色 System Prompt 均少于 200 字；
- 超时、非 2xx、空回复自动降级 Mock。

附件写明 `model: auto`，但项目保留了兼容映射：如果平台不接受 `auto`，服务端使用已配置的具体文本模型。是否可用只需在账户恢复后做一次真实请求验证。

## TTS 与 ASR

附件给出的以下两个 Agent Plan 地址目前不能直接视为已确认：

- `/api/plan/v3/audio/speech`
- `/api/plan/v3/audio/transcriptions`

火山引擎官方“豆包语音”公共云文档展示的是独立语音服务接入方式，通常涉及 AppID、Access Token、Resource ID 和单独开通的能力；语音识别大模型文档示例域名为 `openspeech.bytedance.com`。因此，不能先假设 Ark Key、`model:auto` 和附件中的两个路径足以完成语音调用。

项目当前已新增服务端 `/api/tts`：优先使用豆包语音 V3 SSE 接口，支持新版 `X-Api-Key`，也兼容控制台要求的 `X-Api-App-Id` + `X-Api-Access-Key`；凭证缺失或调用失败时，前端自动回退系统语音。

官方参考：

- 豆包语音合成大模型：https://www.volcengine.com/docs/6561/1257543
- 大模型录音文件极速识别：https://www.volcengine.com/docs/6561/1631584
- Agent Plan 对话 API：https://www.volcengine.com/docs/82379/1494384

## 接入前必须确认的语音信息

1. 控制台是否已开通豆包语音 TTS 和 ASR；
2. 语音服务的 AppID / Access Token 或网关鉴权方式；
3. TTS Resource ID 与三个音色的可用权限；
4. ASR Resource ID、音频格式和请求体格式；
5. 是否确实支持 Agent Plan 统一网关；若支持，应以控制台生成的可执行示例为准。

确认这些信息后再实现服务端 `/api/tts` 和 `/api/asr`，避免错误接口反复收费或把凭证暴露到 H5。
