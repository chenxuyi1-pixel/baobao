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

function shapeRoleReply(role, text, reply) {
  if (role === "duomi" && /妈妈.*(好妈妈|好吗|好不好)|是.*好妈妈/.test(text)) {
    return "当然是呀。妈妈累了还会抱抱我，就是好妈妈。";
  }
  return reply;
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body || {};
  const requestedRole = String(body.role || "neutral");
  const role = ROLE_CONFIG[requestedRole] ? requestedRole : "neutral";
  const customRole = requestedRole === "custom" ? body.customRole : null;
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
      const reply = await requestArkChat(role, text, body.history, customRole);
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
