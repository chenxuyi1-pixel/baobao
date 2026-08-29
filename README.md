# 抱抱她 Baobao 💗

> 你不是一个人，我一直都在

一款面向女性的AI情绪陪伴H5应用，通过多个人格化角色提供24小时在线的温暖陪伴。

## ✨ 产品特色

- **🎭 多角色陪伴** — 通用角色、温柔妈妈、闺蜜、小宝宝，四个角色各有风格
- **🎙️ 真人语音** — 基于火山引擎TTS，每个角色有专属音色，陪伴不止于文字
- **📱 即开即用** — 轻量级H5，无需下载，打开就能聊
- **🎨 暖愈视觉** — 糖素系设计风格，从视觉到对话全方治愈

## 🛠️ 技术栈

- 大模型：字节跳动豆包（doubao-seed-character）
- 语音合成：火山引擎 seed-tts-2.0
- 前端：原生 HTML5 + CSS3 + JavaScript
- 部署：Vercel Serverless Functions

## 🚀 本地运行

```bash
# 安装依赖（Node.js 18+）
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 API Key

# 启动服务（默认端口 8765）
node server.mjs
