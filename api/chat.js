// Vercel Serverless Function: /api/chat
// 抱抱她｜文本对话接口（豆包大模型）

import { ROLE_CONFIG, matchSafety, getMockReply } from "../data/role-content.js";

const arkApiKey = process.env.ARK_API_KEY || "";
const arkBaseUrl = (process.env.ARK_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3").replace(/\/+$/, "");
const arkModel = process.env.ARK_MODEL || "doubao-seed-character-260628";
const arkTimeoutMs = Math.max(5000, Number(process.env.ARK_TIMEOUT_MS || 20000));
const configuredMode = (process.env.BAOBAO_MODE || "demo").toLowerCase();
const useRealApi = (process.env.VITE_USE_REAL_API || "false").toLowerCase() === "true";
const requestedMode = useRealApi ? "live" : configuredMode;
const liveEnabled = requestedMode !== "demo" && Boolean(arkApiKey);

function extractReply(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content.map(part => typeof part === "string" ? part : part?.text || "").join("").trim();
  }
  return "";
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
  return reply || "我在。你不用急着把事情说清楚，想到哪里就说到哪里。";
}

async function requestArkChat(role, text, history = []) {
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
            content: `${ROLE_CONFIG[role]?.systemPrompt || "你是抱抱她里的温柔倾听者，请先回应情绪，再给一个很小的下一步。"}

对话相关性要求：必须直接回应用户本轮最新消息的主题，不要套用与当前输入无关的预设台词，也不要把上一轮的建议当成这一轮的答案。若信息不足，明确追问一个与用户原话相关的问题；不要凭空猜测用户没有说过的经历。`
          },
          ...normalizeHistory(history),
          { role: "user", content: text }
        ],
        temperature: 0.7,
        max_tokens: 200
      }),
      signal: controller.signal
    });
    const raw = await response.text();
    let payload = {};
    try { payload = JSON.parse(raw); } catch {}
    if (!response.ok) throw new Error(`Ark request failed: ${response.status}`);
    const reply = extractReply(payload);
    if (!reply) throw new Error("Ark response did not contain a message");
    return reply;
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const role = ROLE_CONFIG[body.role] ? body.role : "neutral";
  const text = String(body.text || "").trim();

  if (!text) {
    return res.status(400).json({ error: "请输入想说的话" });
  }

  // 安全分流
  const safety = matchSafety(text);
  if (safety) {
    return res.status(200).json({
      reply: safety.response,
      emotion: safety.label,
      riskLevel: safety.level,
      safety: true,
      demo: false
    });
  }

  // 真实模式
  if (liveEnabled) {
    try {
      const reply = await requestArkChat(role, text, body.history);
      return res.status(200).json({
        reply,
        emotion: "需要被听见",
        riskLevel: "low",
        demo: false,
        fallback: false,
        provider: "doubao",
        model: arkModel
      });
    } catch (error) {
      console.log(`[chat] 豆包请求失败，降级 Mock：${error.message}`);
      return res.status(200).json({
        reply: mockReply(role, body.history, text),
        emotion: "需要被听见",
        riskLevel: "low",
        demo: true,
        fallback: true,
        provider: "mock"
      });
    }
  }

  // Demo 模式
  return res.status(200).json({
    reply: mockReply(role, body.history, text),
    emotion: "需要被听见",
    riskLevel: "low",
    demo: true
  });
}
