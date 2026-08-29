import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import { ROLE_CONFIG, matchSafety, getMockReply } from "./public/data/role-content.js";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

async function loadLocalEnv(filename) {
  try {
    const source = await readFile(join(projectRoot, filename), "utf8");
    for (const line of source.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key] && value) process.env[key] = value;
    }
  } catch {
    // .env is optional; demo mode works without it.
  }
}

await loadLocalEnv(".env.local");
await loadLocalEnv(".env");

const root = join(projectRoot, "public");
const port = Number(process.env.PORT || 4173);
const useRealApi = String(process.env.VITE_USE_REAL_API || "false").toLowerCase() === "true";
const configuredMode = String(process.env.BAOBAO_MODE || "demo").toLowerCase();
const requestedMode = useRealApi ? "live" : configuredMode;
const arkApiKey = String(process.env.ARK_API_KEY || "").trim();
const arkBaseUrl = String(process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/+$/, "");
const configuredArkModel = String(process.env.ARK_MODEL || "auto").trim();
// Agent Plan 当前不接受 auto 字符串，使用已验证可用的轻量文本模型作为默认路由。
const arkModel = configuredArkModel.toLowerCase() === "auto" ? "doubao-seed-2-0-lite" : configuredArkModel;
const arkTimeoutMs = Math.max(5000, Number(process.env.ARK_TIMEOUT_MS || 20000));
const liveEnabled = requestedMode !== "demo" && Boolean(arkApiKey);
const mode = liveEnabled ? "live" : "demo";

const realtimeApiKey = String(process.env.DOUBAO_REALTIME_API_KEY || "").trim();
const realtimeEndpoint = String(process.env.DOUBAO_REALTIME_ENDPOINT || "wss://openspeech.bytedance.com/api/v3/duplex/realtime/dialogue").trim();
const realtimeReady = Boolean(realtimeApiKey && realtimeEndpoint);

// 豆包语音服务与 Ark 文本服务的凭证、资源权限可能不同，不能默认复用 ARK_API_KEY。
const ttsApiKey = String(process.env.DOUBAO_TTS_API_KEY || process.env.VOLCENGINE_TTS_API_KEY || "").trim();
const ttsAppId = String(process.env.DOUBAO_TTS_APP_ID || process.env.VOLCENGINE_APP_ID || "").trim();
const ttsAccessToken = String(process.env.DOUBAO_TTS_ACCESS_TOKEN || process.env.VOLCENGINE_ACCESS_TOKEN || "").trim();
const ttsEndpoint = String(process.env.DOUBAO_TTS_ENDPOINT || "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse").trim();
const ttsResourceId = String(process.env.DOUBAO_TTS_RESOURCE_ID || "seed-tts-2.0").trim();
const ttsTimeoutMs = Math.max(5000, Number(process.env.DOUBAO_TTS_TIMEOUT_MS || 20000));
const ttsReady = Boolean(ttsResourceId && (ttsApiKey || (ttsAppId && ttsAccessToken)));
const ttsVoices = {
  neutral: String(process.env.TTS_VOICE_NEUTRAL || "zh_female_qingchezizi_uranus_bigtts"),
  mama: String(process.env.TTS_VOICE_MAMA || "zh_female_wenroumama_uranus_bigtts"),
  yingjie: String(process.env.TTS_VOICE_YINGJIE || "zh_female_qingchezizi_uranus_bigtts"),
  duomi: String(process.env.TTS_VOICE_DUOMI || "zh_male_naiqimengwa_mars_bigtts")
};
// V3 TTS 使用 [-50, 100] 的 speech_rate；20 对应约 1.2 倍速。
const ttsSpeechRates = { neutral: 0, mama: 20, yingjie: 10, duomi: 0 };

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8"
};

function json(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const replies = {
  neutral: "我在。你不用急着把事情说清楚，想到哪里就说到哪里。",
  ...Object.fromEntries(Object.entries(ROLE_CONFIG).map(([id, role]) => [id, role.opening[0]]))
};

function extractReply(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map(part => typeof part === "string" ? part : part?.text || "").join("").trim();
  }
  return "";
}

function shapeRoleReply(role, text, reply) {
  if (role === "duomi" && /妈妈.*(好妈妈|好吗|好不好)|是.*好妈妈/.test(text)) {
    return "当然是呀。妈妈累了还会抱抱我，就是好妈妈。";
  }
  return reply;
}

function extractTtsAudio(raw, contentType = "") {
  if (!raw?.length) return Buffer.alloc(0);
  if (/audio\//i.test(contentType)) return Buffer.from(raw);

  const source = Buffer.from(raw).toString("utf8");
  const chunks = [];
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    let payload;
    try { payload = JSON.parse(trimmed.slice(5).trim()); } catch { continue; }
    if (payload?.code && ![0, 20000000].includes(payload.code)) {
      throw new Error(`TTS ${payload.code}: ${payload.message || "语音资源未授权"}`);
    }
    if (payload?.data) chunks.push(Buffer.from(payload.data, "base64"));
  }
  if (chunks.length) return Buffer.concat(chunks);

  try {
    const payload = JSON.parse(source);
    if (payload?.code && ![0, 20000000].includes(payload.code)) {
      throw new Error(`TTS ${payload.code}: ${payload.message || "语音资源未授权"}`);
    }
    if (payload?.data) return Buffer.from(payload.data, "base64");
  } catch {}
  return Buffer.alloc(0);
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .slice(-6)
    .map(item => ({ role: item.role, content: item.content.slice(0, 800) }));
}

function mockReply(role, history = [], text = "") {
  const reply = getMockReply(role, text, history);
  return reply || replies[role] || replies.neutral;
}

function customRolePrompt(customRole) {
  if (!customRole || typeof customRole !== "object") return "";
  const clean = (value, limit) => String(value || "").replace(/[<>]/g, "").trim().slice(0, limit);
  const name = clean(customRole.name, 20) || "陪伴者";
  const relation = clean(customRole.relation, 30) || "懂用户的陪伴者";
  const personality = clean(customRole.personality, 240) || "温柔、耐心、先听用户说完";
  const catchphrase = clean(customRole.catchphrase, 60);
  return `你是用户定制的陪伴角色“${name}”，关系是“${relation}”。你的性格和说话方式：${personality}。${catchphrase ? `你常说“${catchphrase}”，但不要机械地每次重复。` : ""}

先直接回应用户本轮内容；闲聊自然接话，倾诉先回应感受，明确求建议时再给一个小步骤。每次2—4句，口语化。不冒充真人、不编造共同经历、不制造依赖、不做诊断。涉及自伤或伤人，立即停止角色语气并引导联系身边人、120/110或12356。`;
}

async function requestArkChat(role, text, history = [], customRole = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), arkTimeoutMs);
  try {
    const response = await fetch(`${arkBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${arkApiKey}`
      },
      body: JSON.stringify({
        model: arkModel,
        messages: [
          {
            role: "system",
            content: `${customRolePrompt(customRole) || ROLE_CONFIG[role]?.systemPrompt || "你是抱抱她里的温柔倾听者，请先回应情绪，再给一个很小的下一步。"}

对话相关性要求：必须直接回应用户本轮最新消息的主题，不要套用与当前输入无关的预设台词，也不要把上一轮的建议当成这一轮的答案。若信息不足，明确追问一个与用户原话相关的问题；不要凭空猜测用户没有说过的经历。`
          },
          ...normalizeHistory(history),
          { role: "user", content: text }
        ],
        temperature: 0.7,
        max_tokens: role === "duomi" ? 90 : 200
      }),
      signal: controller.signal
    });
    const raw = await response.text();
    let payload = {};
    try { payload = JSON.parse(raw); } catch {}
    if (!response.ok) throw new Error(`Ark request failed: ${response.status}`);
    const reply = extractReply(payload);
    if (!reply) throw new Error("Ark response did not contain a message");
    return shapeRoleReply(role, text, reply);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestDoubaoTts(role, text) {
  if (!ttsReady) throw new Error("TTS credentials are not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ttsTimeoutMs);
  try {
    const headers = {
      "content-type": "application/json",
      "x-api-resource-id": ttsResourceId,
      "x-api-request-id": randomUUID()
    };
    if (ttsApiKey) headers["x-api-key"] = ttsApiKey;
    else {
      headers["x-api-app-id"] = ttsAppId;
      headers["x-api-access-key"] = ttsAccessToken;
    }

    const response = await fetch(ttsEndpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user: { uid: `baobao-${role}` },
        req_params: {
          text: String(text).slice(0, 900),
          speaker: ttsVoices[role] || ttsVoices.neutral,
          audio_params: {
            format: "mp3",
            sample_rate: 24000,
            speech_rate: ttsSpeechRates[role] || 0
          },
          additions: JSON.stringify({ disable_markdown_filter: true })
        }
      }),
      signal: controller.signal
    });
    const raw = Buffer.from(await response.arrayBuffer());
    if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);
    const audio = extractTtsAudio(raw, response.headers.get("content-type") || "");
    if (!audio.length) throw new Error("TTS response did not contain audio");
    return audio;
  } finally {
    clearTimeout(timeout);
  }
}

const httpServer = createServer(async (req, res) => {
  try {
    if (req.url === "/api/status") {
      return json(res, 200, {
        mode,
        requestedMode,
        provider: liveEnabled ? "doubao" : "mock",
        model: liveEnabled ? arkModel : null,
        voiceReady: ttsReady,
        textReady: liveEnabled,
        ttsReady,
        realtimeReady,
        fallbackReady: true
      });
    }

    if (req.url === "/api/tts" && req.method === "POST") {
      const body = await readJson(req);
      const role = ROLE_CONFIG[body.role] ? body.role : "neutral";
      const text = String(body.text || "").trim();
      if (!text) return json(res, 400, { error: "语音文本不能为空" });
      try {
        const audio = await requestDoubaoTts(role, text);
        res.writeHead(200, {
          "content-type": "audio/mpeg",
          "cache-control": "no-store",
          "content-length": audio.length,
          "x-baobao-voice": ttsVoices[role] || ttsVoices.neutral
        });
        return res.end(audio);
      } catch (error) {
        console.warn(`[tts] 请求失败，前端回退系统语音：${error.message}`);
        res.setHeader("x-baobao-voice", ttsVoices[role] || ttsVoices.neutral);
        return json(res, 503, { error: "TTS 暂不可用", fallback: true });
      }
    }

    if (req.url === "/api/chat" && req.method === "POST") {
      const body = await readJson(req);
      const requestedRole = String(body.role || "neutral");
      const role = ROLE_CONFIG[requestedRole] ? requestedRole : "neutral";
      const customRole = requestedRole === "custom" ? body.customRole : null;
      const text = String(body.text || "").trim();
      if (!text) return json(res, 400, { error: "请输入想说的话" });

      const safety = matchSafety(text);
      if (safety) {
        return json(res, 200, {
          reply: safety.response,
          emotion: safety.label,
          riskLevel: safety.level,
          safety: true,
          demo: false
        });
      }

      if (liveEnabled) {
        try {
          const reply = await requestArkChat(role, text, body.history, customRole);
          return json(res, 200, {
            reply,
            emotion: "需要被听见",
            riskLevel: "low",
            demo: false,
            provider: "doubao",
            model: arkModel
          });
        } catch (error) {
          console.warn(`[chat] 豆包请求失败，降级 Mock：${error.message}`);
          return json(res, 200, {
            reply: mockReply(role, body.history, text),
            emotion: "需要被听见",
            riskLevel: "low",
            demo: true,
            fallback: true,
            provider: "mock"
          });
        }
      }

      if (mode === "demo") {
        return json(res, 200, {
          reply: mockReply(role, body.history, text),
          emotion: "需要被听见",
          riskLevel: "low",
          demo: true
        });
      }

      return json(res, 200, { reply: mockReply(role, body.history, text), demo: true, fallback: true });
    }

    if (req.url?.startsWith("/api/")) {
      return json(res, 404, { error: "接口不存在" });
    }

    const pathname = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
    const filePath = join(root, safePath);
    if (!filePath.startsWith(root)) return json(res, 403, { error: "禁止访问" });

    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not-file");
    const body = await readFile(filePath);
    res.writeHead(200, {
      "content-type": mime[extname(filePath)] || "application/octet-stream",
      "cache-control": pathname.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "no-cache"
    });
    res.end(body);
  } catch {
    try {
      const body = await readFile(join(root, "index.html"));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(body);
    } catch {
      json(res, 500, { error: "页面暂时无法打开" });
    }
  }
});

const realtimeWss = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024 });

httpServer.on("upgrade", (req, socket, head) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname !== "/api/realtime") return socket.destroy();
  realtimeWss.handleUpgrade(req, socket, head, client => realtimeWss.emit("connection", client));
});

realtimeWss.on("connection", client => {
  if (!realtimeReady) {
    client.send(JSON.stringify({ type: "proxy.error", message: "实时语音尚未配置" }));
    return client.close(1011, "realtime unavailable");
  }

  const upstream = new WebSocket(realtimeEndpoint, {
    headers: { "X-Api-Key": realtimeApiKey },
    handshakeTimeout: 15000,
    maxPayload: 4 * 1024 * 1024
  });
  const pending = [];

  upstream.on("open", () => {
    client.send(JSON.stringify({ type: "proxy.ready" }));
    for (const message of pending.splice(0)) upstream.send(message);
  });
  upstream.on("message", (data, isBinary) => {
    if (client.readyState === WebSocket.OPEN) client.send(data, { binary: isBinary });
  });
  upstream.on("error", error => {
    console.warn(`[realtime] 豆包连接失败：${error.message}`);
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "proxy.error", message: "实时语音连接失败" }));
    }
  });
  upstream.on("close", (code, reason) => {
    if (client.readyState === WebSocket.OPEN) client.close(code || 1000, String(reason || ""));
  });

  client.on("message", (data, isBinary) => {
    if (data.length > 2 * 1024 * 1024) return client.close(1009, "message too large");
    const message = isBinary ? data : data.toString("utf8");
    if (upstream.readyState === WebSocket.OPEN) upstream.send(message, { binary: isBinary });
    else if (upstream.readyState === WebSocket.CONNECTING) pending.push(message);
  });
  client.on("close", () => {
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) upstream.close();
  });
  client.on("error", () => {
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) upstream.close();
  });
});

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`抱抱她 H5 已启动：http://localhost:${port}（${mode} 模式）`);
});
