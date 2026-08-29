// Vercel Serverless Function: /api/status
// 抱抱她｜服务状态查询

export default function handler(req, res) {
  const arkApiKey = process.env.ARK_API_KEY || "";
  const configuredMode = (process.env.BAOBAO_MODE || "demo").toLowerCase();
  const useRealApi = (process.env.VITE_USE_REAL_API || "false").toLowerCase() === "true";
  const requestedMode = useRealApi ? "live" : configuredMode;
  const liveEnabled = requestedMode !== "demo" && Boolean(arkApiKey);
  const mode = liveEnabled ? "live" : "demo";

  const ttsApiKey = process.env.DOUBAO_TTS_API_KEY || "";
  const ttsAppId = process.env.DOUBAO_TTS_APP_ID || "";
  const ttsAccessToken = process.env.DOUBAO_TTS_ACCESS_TOKEN || "";
  const ttsResourceId = process.env.DOUBAO_TTS_RESOURCE_ID || "";
  const ttsReady = Boolean(ttsResourceId && (ttsApiKey || (ttsAppId && ttsAccessToken)));

  const realtimeReady = Boolean(
    process.env.DOUBAO_REALTIME_API_KEY && process.env.DOUBAO_REALTIME_ENDPOINT
  );

  const arkModel = process.env.ARK_MODEL || "doubao-seed-character-260628";

  res.status(200).json({
    mode,
    requestedMode,
    provider: liveEnabled ? "doubao" : "mock",
    model: liveEnabled ? arkModel : null,
    voiceReady: ttsReady,
    textReady: liveEnabled,
    ttsReady,
    realtimeReady,
    fallbackReady: true,
    region: process.env.VERCEL_REGION || null,
    deployment: "vercel-serverless"
  });
}
