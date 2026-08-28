# 抱抱她｜比赛 H5

这是一个优先保证比赛现场可用的移动端 H5。默认运行在 `demo` 模式，不需要密钥：支持通用倾听、英姐、沈有才、小多米四种陪伴方式，提供文字输入、浏览器语音能力（可用时）、角色化回复和分级安全兜底。配置 Ark Key 并打开开关后，可切换到豆包文本对话，失败会自动回到 Mock。

## 内容资产

- `public/data/role-content.js`：四个角色的精简 System Prompt、开场白、场景样例和安全规则。
- `public/data/mock-dialogue.js`：按问候、闲聊、倾诉、建议、庆祝、纠错和道别等意图组织的 Demo 对话库。
- `content/角色Prompt与安全分流_v1.0.md`：可直接复制到模型平台的完整 Prompt、边界和安全分流话术。
- `content/比赛演示脚本与验收清单_v1.0.md`：3 分钟演示顺序、接口异常备用动作和 iPhone 16 Pro 验收项。

演示模式会先识别常见对话意图，再使用对应角色语气回复；不会按轮次轮播无关台词。真实接口暂时不可用时会自动降级到该对话库。

## 本地运行

```bash
npm run dev
```

浏览器打开 `http://localhost:4173`。同一局域网手机访问时，将 `localhost` 换成电脑局域网地址；但 iPhone 麦克风需要 HTTPS，局域网 HTTP 地址只能先用文字输入。

## 配置说明

复制 `.env.example` 为 `.env.local`，只在本机填写真实密钥。服务端读取 `.env.local`，密钥不会进入前端代码：

```bash
VITE_USE_REAL_API=true
BAOBAO_MODE=live
ARK_API_KEY=你的 Ark Key
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/plan/v3
ARK_MODEL=doubao-seed-2-0-lite
```

`VITE_USE_REAL_API=false` 或未填写 `ARK_API_KEY` 时保持 Mock。真实接口请求超时、报错或返回异常时，服务端自动降级到 Mock，不影响演示。

当前 `/api/chat` 在服务端完成 Ark 调用，前端只发送角色、用户消息和最近 6 条历史（3 次用户 + 3 次助理），避免把 Key 暴露给浏览器；单次回复上限为 200 tokens。`/api/tts` 已接入豆包语音 V3 SSE，`/api/realtime` 已通过服务端 WebSocket 代理接入豆包端到端实时语音；凭证缺失或接口失败时会保留文字输入、Mock 对话和浏览器系统语音兜底。

## 云端部署

1. 上传整个项目目录并安装依赖：`npm install`。
2. 启动命令：`npm start`。
3. 对外端口读取环境变量 `PORT`，默认 `4173`。
4. 在部署平台的“环境变量/Secrets”中按 `.env.example` 填写真实凭证，不要上传 `.env.local`。
5. 纯 Demo 可直接使用默认配置；需要真实文本与语音时，将 `BAOBAO_MODE=live`、`VITE_USE_REAL_API=true`，并配置 Ark、TTS、Realtime 对应凭证。
6. 平台必须支持 Node.js 长连接和 WebSocket 转发，否则实时语音不可用，但文字对话与 Mock 兜底仍可测试。

## 比赛演示建议

1. 选择“英姐”。
2. 点击开始说话，说：“最近每天都很累，可是好像没有人觉得我辛苦。”
3. 再次点击结束，观察转写和角色回复。
4. 点击回复卡片右侧播放按钮。
5. 返回切换“沈有才”，用同一句话对比角色差异。

若浏览器不支持系统语音转写，不会伪造用户输入；页面会提示重新说或改用文字。

## 后续 TTS 音色记录（需在语音服务中核对权限）

- 英姐/妈妈：`zh_female_wenroumama_uranus_bigtts`
- 沈有才：`zh_female_qingchezizi_uranus_bigtts`
- 小多米：`zh_male_naiqimengwa_mars_bigtts`
