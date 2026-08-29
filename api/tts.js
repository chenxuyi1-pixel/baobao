// Vercel Serverless Function: /api/tts
// 抱抱她｜语音合成接口（豆包 TTS）

const ttsApiKey = process.env.DOUBAO_TTS_API_KEY || process.env.VOLCENGINE_TTS_API_KEY || "";
const ttsAppId = process.env.DOUBAO_TTS_APP_ID || process.env.VOLCENGINE_APP_ID || "";
const ttsAccessToken = process.env.DOUBAO_TTS_ACCESS_TOKEN || process.env.VOLCENGINE_ACCESS_TOKEN || "";
const ttsEndpoint = process.env.DOUBAO_TTS_ENDPOINT || "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse";
const ttsResourceId = process.env.DOUBAO_TTS_RESOURCE_ID || "";
const ttsTimeoutMs = Math.max(5000, Number(process.env.DOUBAO_TTS_TIMEOUT_MS || 20000));
const ttsReady = Boolean(ttsResourceId && (ttsApiKey || (ttsAppId && ttsAccessToken)));

const ttsVoices = {
  neutral: process.env.TTS_VOICE_NEUTRAL || "zh_female_qingchezizi_uranus_bigtts",
  mama: process.env.TTS_VOICE_MAMA || "zh_female_wenroumama_uranus_bigtts",
  yingjie: process.env.TTS_VOICE_YINGJIE || "zh_female_qingchezizi_uranus_bigtts",
  // 比赛版锁定角色音色，避免云端遗留环境变量把小多米切回错误女声。
  duomi: "zh_male_naiqimengwa_mars_bigtts"
};
// V3 TTS 使用 [-50, 100] 的 speech_rate；20 对应约 1.2 倍速。
const ttsSpeechRates = { neutral: 0, mama: 20, yingjie: 10, duomi: 0 };

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

async function requestDoubaoTts(role, text) {
  if (!ttsReady) throw new Error("TTS credentials are not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ttsTimeoutMs);
  try {
    const headers = {
      "content-type": "application/json",
      "x-api-resource-id": ttsResourceId,
      "x-api-request-id": Math.random().toString(36).slice(2) + Date.now().toString(36)
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

export default async function handler(req, res) {
  const startedAt = Date.now();
  const region = process.env.VERCEL_REGION || "local";

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const roleId = body.role && ttsVoices[body.role] ? body.role : "neutral";
  const text = String(body.text || "").trim();

  if (!text) {
    return res.status(400).json({ error: "语音文本不能为空" });
  }

  try {
    const audio = await requestDoubaoTts(roleId, text);
    res.setHeader("content-type", "audio/mpeg");
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-length", audio.length);
    res.setHeader("server-timing", `doubao-tts;dur=${Date.now() - startedAt}`);
    res.setHeader("x-baobao-region", region);
    res.setHeader("x-baobao-voice", ttsVoices[roleId] || ttsVoices.neutral);
    return res.status(200).send(audio);
  } catch (error) {
    console.log(`[tts] 请求失败，前端回退系统语音：${error.message}`);
    res.setHeader("server-timing", `doubao-tts;dur=${Date.now() - startedAt}`);
    res.setHeader("x-baobao-region", region);
    res.setHeader("x-baobao-voice", ttsVoices[roleId] || ttsVoices.neutral);
    return res.status(503).json({
      error: "TTS 暂不可用",
      fallback: true,
      elapsedMs: Date.now() - startedAt,
      region
    });
  }
}
