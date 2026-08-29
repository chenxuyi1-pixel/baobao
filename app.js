import { ROLE_CONFIG, matchSafety, getMockReply, SAFETY_COPY } from "/data/role-content.js";

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

const icons = {
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="m15 18-6-6 6-6"/></svg>`,
  soundOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>`,
  soundOn: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 9.5a4 4 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/></svg>`,
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3m-4 0h8"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 5v14M5 12h14"/></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m5 18 4.5-4.5 3 3 2-2 4.5 3.5"/></svg>`
};

const roles = {
  neutral: {
    name: "就陪我说说",
    mode: "不需要先选一种关系",
    intro: "我在。你不用急着把事情说清楚，想到哪里就说到哪里。",
    voice: "中性陪伴",
    realtimeVoice: "zh_female_qingchezizi_uranus_bigtts",
    realtimeSpeed: 0,
    soft: "#f0ecff"
  },
  yingjie: {
    ...ROLE_CONFIG.yingjie,
    intro: ROLE_CONFIG.yingjie.opening[0],
    voice: ROLE_CONFIG.yingjie.voiceStyle,
    realtimeVoice: "zh_female_qingchezizi_uranus_bigtts",
    realtimeSpeed: 10,
    soft: "#f7ece9"
  },
  mama: {
    ...ROLE_CONFIG.mama,
    intro: ROLE_CONFIG.mama.opening[0],
    voice: ROLE_CONFIG.mama.voiceStyle,
    realtimeVoice: "zh_female_wenroumama_uranus_bigtts",
    realtimeSpeed: 20,
    soft: "#eaf3f8"
  },
  duomi: {
    ...ROLE_CONFIG.duomi,
    intro: ROLE_CONFIG.duomi.opening[0],
    voice: ROLE_CONFIG.duomi.voiceStyle,
    realtimeVoice: "ICL_zh_female_keainvsheng_tob",
    realtimeSpeed: 0,
    soft: "#fcecef"
  },
  custom: {
    name: "我的陪伴者",
    mode: "按你熟悉的方式陪着你",
    intro: "我来啦。今天想从哪里开始说？",
    voice: "自然陪伴",
    realtimeVoice: "zh_female_qingchezizi_uranus_bigtts",
    realtimeSpeed: 0,
    soft: "#f2edff",
    background: "morning",
    avatar: "",
    systemPrompt: ROLE_CONFIG.neutral.systemPrompt
  }
};

const state = {
  screen: "home",
  role: "yingjie",
  recording: false,
  sound: false,
  transcript: "",
  reply: "",
  seconds: 0,
  timer: null,
  recognition: null,
  stream: null,
  realtime: null,
  captureContext: null,
  captureSource: null,
  captureProcessor: null,
  playbackContext: null,
  playbackAt: 0,
  realtimeReply: "",
  realtimeTranscript: "",
  realtimeResponding: false,
  responseTimer: null,
  mockIndex: 0,
  history: [],
  customDraft: {
    name: "",
    relation: "懂你的陪伴者",
    personality: "温柔、耐心、先听我说完，再给一点小建议",
    catchphrase: "没关系，我们慢慢来。",
    background: "morning",
    avatar: ""
  },
  customSaved: false
};

const roleCutoutAssets = ["mama", "yingjie", "duomi"].map(id => `/assets/character-${id}-cutout-v2.webp`);
const roleBackgroundAssets = ["mama", "yingjie", "duomi"].map(id => `/assets/chat-bg-${id}-v2.webp`);
const visualAssetCache = new Map();

function preloadVisualAssets() {
  const load = src => new Promise(resolve => {
    const image = new Image();
    visualAssetCache.set(src, image);
    image.onload = image.onerror = resolve;
    image.src = src;
    image.decode?.().then(resolve).catch(() => {});
  });
  // 角色列表是首页之后的下一屏，立即请求并解码，避免用户快速点击时人物后出现。
  Promise.allSettled(roleCutoutAssets.map(load)).then(() => {
    const loadBackgrounds = () => Promise.allSettled(roleBackgroundAssets.map(load));
    if ("requestIdleCallback" in window) requestIdleCallback(loadBackgrounds, { timeout: 500 });
    else setTimeout(loadBackgrounds, 40);
  });
}

function restoreCustomRole() {
  try {
    const saved = JSON.parse(localStorage.getItem("baobao-custom-role") || "null");
    if (!saved || typeof saved !== "object" || !String(saved.name || "").trim()) return;
    state.customDraft = { ...state.customDraft, ...saved };
    state.customSaved = true;
    createCustomRole();
  } catch {
    // 角色保存是增强功能，读取失败不影响默认角色使用。
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function renderHome() {
  state.screen = "home";
  stopRecording(true);
  app.innerHTML = `
    <section class="screen home-screen">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">抱</span>抱抱她</div>
        <button class="icon-button" id="privacy" aria-label="查看隐私说明">${icons.lock}</button>
      </header>

      <div class="home-hero">
        <div class="home-visual" aria-hidden="true">
          <div class="home-orbit orbit-one"></div>
          <div class="home-orbit orbit-two"></div>
          <div class="home-orb"><span></span></div>
          <span class="home-spark spark-one"></span>
          <span class="home-spark spark-two"></span>
          <div class="home-whisper">先让你被听见</div>
        </div>
        <h1>不用马上坚强，<br />先让自己被听见。</h1>
        <p class="subtitle">抱抱她是一段不催你振作的陪伴。你可以说委屈，也可以只说一句“我今天好累”。</p>
      </div>

      <div class="home-actions">
        <button class="home-primary" id="startCompanion">开始选择陪伴方式 <span>→</span></button>
        <button class="home-secondary" id="directTalk">我想直接说说</button>
      </div>
      <div class="home-note"><span class="mode-dot"></span>不保存对话 · 角色设置仅在你主动保存后留在本机</div>
    </section>`;

  document.querySelector("#startCompanion").addEventListener("click", renderSelect);
  document.querySelector("#directTalk").addEventListener("click", () => renderChat("neutral"));
  document.querySelector("#privacy").addEventListener("click", () => showToast("演示模式不上传、不保存任何对话"));
}

function renderSelect() {
  state.screen = "select";
  stopRecording(true);
  app.innerHTML = `
    <section class="screen select-screen">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">抱</span>抱抱她</div>
        <button class="icon-button" id="privacy" aria-label="查看隐私说明">${icons.lock}</button>
      </header>
      <h1>现在，你更想被怎样陪着？</h1>
      <p class="subtitle">不用解释得很完整，选一个让你觉得舒服的方式就好。</p>

      <button class="companion-card" data-role="neutral">
        <span class="card-kicker">还不知道需要什么</span>
        <strong>就陪我说说</strong>
        <p>有人听着，不分析，也不催你振作</p>
        <span class="arrow">→</span>
      </button>

      <p class="section-label">或者，选一个熟悉的陪伴方式</p>
      <div class="role-list">
        ${roleCard("mama", "可靠长辈", "像妈妈一样接住你")}
        ${roleCard("yingjie", "酷闺蜜", "不评判，陪我把委屈说完")}
        ${roleCard("duomi", "陪你缓一缓", "先喘口气，再慢慢来")}
      </div>

      <button class="custom-entry" id="customEntry">
        <span class="custom-entry-icon">${icons.plus}</span>
        <span class="custom-entry-copy">
          <span class="role-kicker">${state.customSaved ? "已保存在本机" : "会员可保存"}</span>
          <strong>${state.customSaved ? escapeHtml(roles.custom.name) : "定制我的陪伴者"}</strong>
          <p>${state.customSaved ? "继续修改头像、背景、人设和口头禅" : "自己选头像、背景、人设和熟悉的口头禅"}</p>
        </span>
        <span class="arrow">→</span>
      </button>
      <div class="mode-pill" id="modePill"><span class="mode-dot"></span>正在检查实时语音 · 不保存对话</div>
    </section>`;

  document.querySelectorAll("[data-role]").forEach(button => {
    button.addEventListener("click", () => renderChat(button.dataset.role));
  });
  document.querySelector("#customEntry").addEventListener("click", renderCustomize);
  document.querySelector("#privacy").addEventListener("click", () => showToast("演示模式不上传、不保存任何对话"));
  updateServiceBadge();
}

async function updateServiceBadge() {
  const badge = document.querySelector("#modePill");
  if (!badge) return;
  try {
    const response = await fetch("/api/status");
    const status = await response.json();
    badge.innerHTML = `<span class="mode-dot"></span>${status.realtimeReady ? "豆包实时语音已连接" : "比赛演示模式"} · 不保存对话`;
    badge.classList.toggle("is-live", Boolean(status.realtimeReady));
  } catch {
    badge.innerHTML = '<span class="mode-dot"></span>比赛演示模式 · 不保存对话';
  }
}

function roleCard(id, kicker, copy) {
  return `<button class="role-card ${id}" data-role="${id}">
    <span class="role-art ${id}" aria-hidden="true"></span>
    <span class="role-copy">
      <span class="role-kicker">${kicker}</span>
      <strong>${roles[id].name}</strong>
      <p>${copy}</p>
    </span>
    <span class="arrow" style="position:static">→</span>
  </button>`;
}

function customAvatarMarkup(draft, className = "") {
  if (draft.avatar) return `<img class="custom-avatar ${className}" src="${draft.avatar}" alt="你为陪伴者选择的头像" />`;
  const initial = escapeHtml((draft.name || "她").slice(0, 1));
  return `<div class="custom-avatar-placeholder ${className}" aria-hidden="true"><span>${initial}</span></div>`;
}

function renderCustomize() {
  state.screen = "customize";
  stopRecording(true);
  const draft = state.customDraft;
  app.innerHTML = `
    <section class="screen customize-screen">
      <header class="topbar">
        <button class="icon-button" id="back" aria-label="返回角色选择">${icons.back}</button>
        <div class="chat-title"><strong>定制陪伴者</strong><span>先体验，保存时再选择会员</span></div>
        <span class="topbar-spacer" aria-hidden="true"></span>
      </header>

      <div class="custom-preview custom-bg-${draft.background}" id="customPreview">
        <div class="custom-preview-orbit" aria-hidden="true"></div>
        <div id="customAvatarPreview">${customAvatarMarkup(draft, "custom-avatar-large")}</div>
        <div class="custom-preview-copy">
          <strong id="customNamePreview">${escapeHtml(draft.name || "你的陪伴者")}</strong>
          <span id="customCatchPreview">${escapeHtml(draft.catchphrase || "先写一句她常对你说的话")}</span>
        </div>
      </div>

      <form class="custom-form" id="customForm">
        <div class="custom-section">
          <div class="custom-section-heading"><strong>她是谁</strong><span>这些内容之后都可以修改</span></div>
          <label class="field-label" for="customName">名字</label>
          <input class="custom-input" id="customName" maxlength="12" value="${escapeHtml(draft.name)}" placeholder="例如：暖暖、林阿姨" />
          <label class="field-label" for="customRelation">她和你的关系</label>
          <input class="custom-input" id="customRelation" maxlength="16" value="${escapeHtml(draft.relation)}" placeholder="例如：像姐姐一样的朋友" />
        </div>

        <div class="custom-section">
          <div class="custom-section-heading"><strong>她的样子</strong><span>图片只在本次演示中预览</span></div>
          <div class="avatar-upload-row">
            <div id="customAvatarSmall">${customAvatarMarkup(draft, "custom-avatar-small")}</div>
            <label class="upload-button" for="avatarInput">${icons.image}<span>选择头像</span></label>
            <input class="visually-hidden" id="avatarInput" type="file" accept="image/*" />
          </div>
          <span class="field-label">聊天背景</span>
          <div class="background-options" role="group" aria-label="选择聊天背景">
            ${backgroundOption("morning", "晨光", draft.background)}
            ${backgroundOption("garden", "花园", draft.background)}
            ${backgroundOption("night", "晚安", draft.background)}
          </div>
        </div>

        <div class="custom-section">
          <div class="custom-section-heading"><strong>她怎么陪你</strong><span>写得具体，回答会更像她</span></div>
          <label class="field-label" for="customPersonality">人物性格与说话方式</label>
          <textarea class="custom-textarea" id="customPersonality" maxlength="180" rows="4" placeholder="例如：像认识很多年的姐姐，温柔但不说教，先听我吐槽……">${escapeHtml(draft.personality)}</textarea>
          <label class="field-label" for="customCatchphrase">她常说的口头禅</label>
          <input class="custom-input" id="customCatchphrase" maxlength="40" value="${escapeHtml(draft.catchphrase)}" placeholder="例如：没关系，我们慢慢来。" />
        </div>

        <div class="member-note">
          <span>会员功能</span>
          <p>免费角色可以直接使用；定制角色需要会员才能长期保存。比赛演示不会产生真实扣款。</p>
        </div>
        <button class="custom-submit" type="submit">保存设定并查看会员方案 <span>→</span></button>
      </form>
    </section>`;

  document.querySelector("#back").addEventListener("click", renderSelect);
  document.querySelector("#customForm").addEventListener("submit", event => {
    event.preventDefault();
    syncCustomDraft();
    if (!state.customDraft.name.trim()) {
      showToast("先给她取一个名字吧");
      return document.querySelector("#customName").focus();
    }
    renderMembership();
  });
  ["customName", "customRelation", "customPersonality", "customCatchphrase"].forEach(id => {
    document.querySelector(`#${id}`).addEventListener("input", updateCustomPreview);
  });
  document.querySelectorAll("[data-background]").forEach(button => {
    button.addEventListener("click", () => selectCustomBackground(button.dataset.background));
  });
  document.querySelector("#avatarInput").addEventListener("change", handleAvatarUpload);
}

function backgroundOption(id, label, selected) {
  return `<button class="background-option background-${id}" type="button" data-background="${id}" aria-pressed="${id === selected}"><span></span><strong>${label}</strong></button>`;
}

function syncCustomDraft() {
  const read = id => document.querySelector(`#${id}`)?.value.trim() || "";
  state.customDraft.name = read("customName");
  state.customDraft.relation = read("customRelation");
  state.customDraft.personality = read("customPersonality");
  state.customDraft.catchphrase = read("customCatchphrase");
}

function updateCustomPreview() {
  syncCustomDraft();
  const name = document.querySelector("#customNamePreview");
  const catchphrase = document.querySelector("#customCatchPreview");
  if (name) name.textContent = state.customDraft.name || "你的陪伴者";
  if (catchphrase) catchphrase.textContent = state.customDraft.catchphrase || "先写一句她常对你说的话";
  if (!state.customDraft.avatar) {
    document.querySelectorAll(".custom-avatar-placeholder span").forEach(node => {
      node.textContent = (state.customDraft.name || "她").slice(0, 1);
    });
  }
}

function selectCustomBackground(background) {
  state.customDraft.background = background;
  const preview = document.querySelector("#customPreview");
  if (preview) preview.className = `custom-preview custom-bg-${background}`;
  document.querySelectorAll("[data-background]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.background === background));
  });
}

async function handleAvatarUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) return showToast("请选择一张图片");
  try {
    state.customDraft.avatar = await resizeAvatar(file);
    document.querySelector("#customAvatarPreview").innerHTML = customAvatarMarkup(state.customDraft, "custom-avatar-large");
    document.querySelector("#customAvatarSmall").innerHTML = customAvatarMarkup(state.customDraft, "custom-avatar-small");
    showToast("头像已经放进预览里了");
  } catch {
    showToast("这张图片暂时无法读取，请换一张试试");
  }
}

function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      const sx = (image.naturalWidth - sourceSize) / 2;
      const sy = (image.naturalHeight - sourceSize) / 2;
      context.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", .82));
    };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image error")); };
    image.src = url;
  });
}

function renderMembership() {
  state.screen = "membership";
  const draft = state.customDraft;
  app.innerHTML = `
    <section class="screen membership-screen">
      <header class="topbar">
        <button class="icon-button" id="back" aria-label="返回定制角色">${icons.back}</button>
        <div class="chat-title"><strong>抱抱她会员</strong><span>让熟悉的陪伴方式留下来</span></div>
        <span class="topbar-spacer" aria-hidden="true"></span>
      </header>
      <div class="member-portrait custom-bg-${draft.background}">
        ${customAvatarMarkup(draft, "custom-avatar-member")}
        <div><span>即将保存</span><strong>${escapeHtml(draft.name)}</strong><p>${escapeHtml(draft.relation)}</p></div>
      </div>
      <div class="member-benefits">
        <h1>不只选择角色，<br />也可以创造熟悉的她。</h1>
        <p>会员可以保存最多 3 位定制陪伴者，随时修改头像、背景、人设和口头禅。</p>
        <ul>
          <li><span>01</span><div><strong>定制陪伴方式</strong><p>让回复更贴近你熟悉的关系和语气</p></div></li>
          <li><span>02</span><div><strong>保存角色设定</strong><p>下次打开，不需要重新填写</p></div></li>
          <li><span>03</span><div><strong>持续调整</strong><p>根据实际对话随时修改人设</p></div></li>
        </ul>
      </div>
      <div class="plan-selector" role="group" aria-label="会员方案">
        <button type="button" class="plan-option is-selected" data-plan="month" aria-pressed="true"><span>连续包月 · 比赛示意价</span><strong>¥18<small>/月</small></strong></button>
        <button type="button" class="plan-option" data-plan="year" aria-pressed="false"><span>年度会员 · 比赛示意价</span><strong>¥168<small>/年</small></strong><em>约省 22%（示意）</em></button>
      </div>
      <p class="demo-payment-note">比赛演示流程，不会发起真实支付或扣款</p>
      <button class="member-primary" id="demoSubscribe">演示开通并开始试聊</button>
      <button class="member-secondary" id="previewOnly">暂不保存，先试聊一次</button>
    </section>`;

  document.querySelector("#back").addEventListener("click", renderCustomize);
  document.querySelectorAll(".plan-option").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".plan-option").forEach(item => {
        const selected = item === button;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
    });
  });
  document.querySelector("#demoSubscribe").addEventListener("click", () => {
    createCustomRole();
    try {
      localStorage.setItem("baobao-custom-role", JSON.stringify(state.customDraft));
      state.customSaved = true;
      showToast("演示会员已开启，角色已保存在本机");
    } catch {
      showToast("角色已生效，但当前浏览器无法长期保存");
    }
    renderChat("custom");
  });
  document.querySelector("#previewOnly").addEventListener("click", () => {
    createCustomRole();
    renderChat("custom");
  });
}

function createCustomRole() {
  const draft = state.customDraft;
  const catchphrase = draft.catchphrase || "没关系，我们慢慢来。";
  roles.custom = {
    name: draft.name,
    mode: draft.relation || "懂你的陪伴者",
    intro: `${catchphrase} 今天想和我说什么？`,
    voice: "自然陪伴",
    realtimeVoice: "zh_female_qingchezizi_uranus_bigtts",
    realtimeSpeed: 0,
    soft: draft.background === "night" ? "#eeeafd" : draft.background === "garden" ? "#edf5ed" : "#fff0e5",
    background: draft.background,
    avatar: draft.avatar,
    relation: draft.relation,
    personality: draft.personality,
    catchphrase,
    systemPrompt: `你是用户定制的陪伴角色“${draft.name}”，关系是“${draft.relation}”。你的性格和说话方式：${draft.personality}。你常说“${catchphrase}”，但不要机械地每次重复。先直接回应用户本轮内容；闲聊自然接话，倾诉先回应感受，明确求建议时再给一个小步骤。每次2—4句，口语化，不冒充真人、不编造共同经历、不制造依赖。不做诊断；涉及自伤或伤人，立即停止角色语气并引导联系身边人、120/110或12356。`
  };
}

function renderSceneArt(roleId, role) {
  if (roleId === "neutral") return '<div class="neutral-orb" aria-hidden="true"></div>';
  if (roleId === "custom") {
    return `<div class="scene-art custom custom-bg-${role.background}" aria-hidden="true"><div class="scene-backdrop"></div>${customAvatarMarkup(role, "custom-scene-avatar")}<span class="scene-accent accent-one"></span><span class="scene-accent accent-two"></span><span class="scene-accent accent-three"></span></div>`;
  }
  return `<div class="scene-art ${roleId}" aria-hidden="true"><div class="scene-backdrop"></div><img class="character-cutout" src="/assets/character-${roleId}-cutout-v2.webp" alt="" decoding="async" fetchpriority="high" /><span class="scene-accent accent-one"></span><span class="scene-accent accent-two"></span><span class="scene-accent accent-three"></span></div>`;
}

function renderChat(roleId) {
  state.screen = "chat";
  state.role = roleId;
  state.transcript = "";
  state.mockIndex = 0;
  state.history = [];
  state.reply = roles[roleId].intro;
  const role = roles[roleId];

  app.innerHTML = `
    <section class="screen chat-screen" style="--role-soft:${role.soft}">
      <header class="topbar chat-topbar">
        <button class="icon-button" id="back" aria-label="返回选择陪伴方式">${icons.back}</button>
        <div class="chat-title"><strong>${role.name}</strong><span>${role.mode}</span></div>
        <button class="icon-button" id="sound" aria-label="${state.sound ? "关闭声音" : "打开声音"}">${state.sound ? icons.soundOn : icons.soundOff}</button>
      </header>

      <div class="scene">
        ${renderSceneArt(roleId, role)}
        <div class="speech-card" id="reply"><span class="reply-text">${state.reply}</span><span class="typing-indicator" id="typing" aria-label="正在输入"><i></i><i></i><i></i></span><button class="play-reply" id="play" aria-label="播放这句话">▷</button></div>
      </div>

      <div class="heard" id="heard">这里没有标准答案，<strong>你想从哪里说起都可以</strong></div>
      <div class="voice-panel">
        <div class="record-state" id="recordState">等你开口</div>
        <button class="mic-button" id="record">${icons.mic}<span>点击开始说话</span></button>
        <div class="secondary-actions">
          <button class="text-action" id="toggleType">也可以打字</button>
          <button class="switch-action" id="switch">切换陪伴方式</button>
        </div>
        <form class="type-box" id="typeBox">
          <input id="textInput" maxlength="200" placeholder="把此刻最想说的写下来…" autocomplete="off" />
          <button class="send-button" aria-label="发送">↑</button>
        </form>
        <a class="help-link" href="#" id="help">如果你正处于危险中，请立即寻求现实帮助</a>
      </div>
    </section>`;

  document.querySelector("#back").addEventListener("click", renderSelect);
  document.querySelector("#switch").addEventListener("click", renderSelect);
  document.querySelector("#sound").addEventListener("click", toggleSound);
  document.querySelector("#play").addEventListener("click", () => speak(state.reply));
  document.querySelector("#record").addEventListener("click", toggleRecording);
  document.querySelector("#toggleType").addEventListener("click", toggleTypeBox);
  document.querySelector("#typeBox").addEventListener("submit", sendTypedText);
  document.querySelector("#help").addEventListener("click", event => { event.preventDefault(); showSafety(); });
}

function toggleSound() {
  state.sound = !state.sound;
  const button = document.querySelector("#sound");
  button.innerHTML = state.sound ? icons.soundOn : icons.soundOff;
  button.setAttribute("aria-label", state.sound ? "关闭声音" : "打开声音");
  showToast(state.sound ? "声音已打开" : "已静音");
}

function toggleTypeBox() {
  const box = document.querySelector("#typeBox");
  box.classList.toggle("open");
  if (box.classList.contains("open")) document.querySelector("#textInput").focus();
}

function sendTypedText(event) {
  event.preventDefault();
  const input = document.querySelector("#textInput");
  const value = input.value.trim();
  if (!value) return;
  input.value = "";
  handleMessage(value);
}

async function toggleRecording() {
  if (state.recording) return stopRecording();
  if (state.realtimeResponding) return showToast("正在回应你，稍等一下就好");
  state.transcript = "";
  state.realtimeTranscript = "";
  state.realtimeReply = "";
  // iOS Safari 只会在 HTTPS（或 localhost）安全环境中向网页开放麦克风。
  // 当前比赛联调常用的是局域网 HTTP 地址，提前说明原因，避免用户反复点按钮。
  if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    showToast("手机语音需要 HTTPS 安全连接；当前先用文字输入，接入 HTTPS 后即可开启麦克风");
    toggleTypeBox();
    return;
  }
  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    const message = error?.name === "NotAllowedError"
      ? "麦克风权限被拒绝，请在 Safari 网站设置中允许麦克风"
      : "暂时无法打开麦克风，可以先用文字输入";
    showToast(message);
    toggleTypeBox();
    return;
  }

  try {
    await startRealtimeSession();
  } catch (error) {
    cleanupRealtime();
    showToast(error?.message || "实时语音暂时不可用，可以先用文字输入");
    toggleTypeBox();
  }
}

function stopRecording(silent = false) {
  if (!state.recording && !state.realtime) return;
  state.recording = false;
  clearInterval(state.timer);
  state.timer = null;
  stopAudioCapture();
  if (state.screen === "chat") updateRecordUI();
  if (silent) return cleanupRealtime();
  if (!state.realtime || state.realtime.readyState !== WebSocket.OPEN) {
    cleanupRealtime();
    showToast("语音连接已断开，可以再试一次");
    return;
  }
  state.realtimeResponding = true;
  setRecordStatus("正在听懂你…");
  sendRealtime({ type: "input_audio_buffer.commit", event_id: window.crypto?.randomUUID?.() });
  sendRealtime({ type: "input_audio_mute.commit" });
  clearTimeout(state.responseTimer);
  state.responseTimer = setTimeout(() => {
    if (!state.realtimeResponding) return;
    state.realtimeResponding = false;
    showToast(state.transcript ? "这次回应有点慢，可以再试一次" : "没有听清，可以再说一次");
    cleanupRealtime(true);
    updateRecordUI();
  }, 18000);
}

function updateRecordUI() {
  const button = document.querySelector("#record");
  const label = document.querySelector("#recordState");
  if (!button || !label) return;
  if (state.recording) {
    button.classList.add("recording");
    button.querySelector("span").textContent = "点击结束并发送";
    label.innerHTML = `正在听你说 <span class="timer">00:${String(state.seconds).padStart(2,"0")}</span>`;
  } else {
    button.classList.remove("recording");
    button.querySelector("span").textContent = "点击开始说话";
    label.textContent = state.realtimeResponding ? "正在回应你…" : "等你开口";
  }
}

async function startRealtimeSession() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}/api/realtime`);
  state.realtime = ws;

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("实时语音连接超时")), 15000);
    ws.addEventListener("message", async event => {
      const payload = await parseRealtimeMessage(event.data);
      if (!payload) return;
      if (payload.type === "proxy.ready") {
        sendRealtime(buildRealtimeSession());
      } else if (payload.type === "session.created") {
        clearTimeout(timeout);
        try { await beginAudioCapture(); } catch (error) {
          clearTimeout(timeout);
          reject(error);
          return;
        }
        state.recording = true;
        state.seconds = 0;
        updateRecordUI();
        state.timer = setInterval(() => {
          state.seconds += 1;
          updateRecordUI();
          if (state.seconds >= 30) stopRecording();
        }, 1000);
        resolve();
      } else if (payload.type === "proxy.error" || payload.type === "error") {
        clearTimeout(timeout);
        reject(new Error("实时语音服务暂时不可用"));
      }
    });
    ws.addEventListener("message", handleRealtimeEvent);
    ws.addEventListener("error", () => reject(new Error("实时语音连接失败")), { once: true });
    ws.addEventListener("close", () => {
      clearTimeout(timeout);
      if (state.realtimeResponding) showToast("语音连接已结束，可以再说一次");
      state.realtimeResponding = false;
      state.recording = false;
      stopAudioCapture();
      updateRecordUI();
    });
  });
}

function buildRealtimeSession() {
  const history = state.history.slice(-6).map(item => ({
    role: item.role,
    text: item.content,
    timestamp: Date.now()
  }));
  return {
    type: "session.create",
    session: {
      model: "1.2.6.1",
      instructions: realtimeRoleInstructions(),
      audio: {
        input: { format: { type: "pcm", rate: 16000 } },
        output: {
          format: { type: "pcm", rate: 24000 },
          voice: roles[state.role].realtimeVoice,
          speed: roles[state.role].realtimeSpeed,
          loudness: 0
        }
      },
      extension: {
        dialog: {
          dialog_context: history,
          extra: JSON.stringify({ strict_audit: true, audit_response: "我很在意你现在的安全。请先联系身边可信任的人，危险紧急时立即联系当地急救或报警服务。" })
        }
      }
    }
  };
}

function realtimeRoleInstructions() {
  const base = roles[state.role]?.systemPrompt || ROLE_CONFIG[state.role]?.systemPrompt || "你是抱抱她里的温柔倾听者。先直接回应用户，再提供适量情绪价值；需要时安慰，闲聊时自然聊天。";
  if (state.role !== "duomi") return base;
  return `${base}

小多米的童真优先于深度：不要像心理咨询师，不要替妈妈总结人生，也绝不能编造妈妈给你买东西、陪你玩或做过其他用户没有说过的事。听到“你觉得妈妈是好妈妈吗”时，直接说：“当然是呀。妈妈就是好妈妈，我想给妈妈一个大抱抱。”`;
}

async function beginAudioCapture() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("当前浏览器暂不支持实时语音");
  const context = new AudioContextClass();
  await context.resume();
  const source = context.createMediaStreamSource(state.stream);
  const processor = context.createScriptProcessor(2048, 1, 1);
  const silentGain = context.createGain();
  silentGain.gain.value = 0;
  processor.onaudioprocess = event => {
    if (!state.recording || state.realtime?.readyState !== WebSocket.OPEN) return;
    const pcm = resamplePcm16(event.inputBuffer.getChannelData(0), context.sampleRate, 16000);
    sendRealtime({ type: "input_audio_buffer.append", audio: bytesToBase64(new Uint8Array(pcm.buffer)) });
  };
  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(context.destination);
  state.captureContext = context;
  state.captureSource = source;
  state.captureProcessor = processor;
}

function stopAudioCapture() {
  try { state.captureProcessor?.disconnect(); } catch {}
  try { state.captureSource?.disconnect(); } catch {}
  try { state.captureContext?.close(); } catch {}
  state.captureProcessor = null;
  state.captureSource = null;
  state.captureContext = null;
  state.stream?.getTracks().forEach(track => track.stop());
  state.stream = null;
}

async function handleRealtimeEvent(event) {
  const payload = await parseRealtimeMessage(event.data);
  if (!payload) return;
  const heard = document.querySelector("#heard");
  const reply = document.querySelector("#reply");

  if (payload.type === "conversation.item.input_audio_transcription.delta") {
    state.realtimeTranscript = cleanTranscript(mergeTranscript(state.realtimeTranscript, extractEventText(payload)));
    state.transcript = state.realtimeTranscript;
    if (heard) heard.innerHTML = `我听见你说：<strong>“${escapeHtml(state.transcript)}”</strong>`;
  }
  if (payload.type === "conversation.item.input_audio_transcription.completed") {
    // completed 是本轮最终转写，必须替换临时 delta，继续拼接会把整句话再复制一遍。
    const completedText = extractEventText(payload);
    state.realtimeTranscript = cleanTranscript(completedText || state.realtimeTranscript);
    state.transcript = state.realtimeTranscript;
    if (heard && state.transcript) heard.innerHTML = `我听见你说：<strong>“${escapeHtml(state.transcript)}”</strong>`;
    const safety = matchSafety(state.transcript);
    if (safety) showSafety(safety.action);
  }
  if (payload.type === "response.output_text.delta") {
    state.realtimeReply += extractEventText(payload);
    if (reply) setReplyText(reply, state.realtimeReply || "", !state.realtimeReply);
  }
  if (payload.type === "response.output_text.done") {
    state.realtimeReply = extractEventText(payload) || state.realtimeReply;
    state.reply = state.realtimeReply || state.reply;
    if (reply) setReplyText(reply, state.reply);
  }
  if (payload.type === "response.output_audio.delta") {
    const audio = payload.delta || payload.audio || payload.data;
    if (audio) await queuePcmAudio(audio);
  }
  if (payload.type === "response.output_audio.done" || payload.type === "response.done") {
    finalizeRealtimeTurn();
  }
  if (payload.type === "error") {
    showToast("这次没有听清，可以再试一次");
    finalizeRealtimeTurn(false);
  }
}

function finalizeRealtimeTurn(save = true) {
  if (!state.realtimeResponding && !state.realtime) return;
  state.realtimeResponding = false;
  clearTimeout(state.responseTimer);
  state.responseTimer = null;
  state.reply = state.realtimeReply || state.reply;
  if (save && state.transcript && state.reply) {
    state.history.push({ role: "user", content: state.transcript }, { role: "assistant", content: state.reply });
    state.history = state.history.slice(-6);
  }
  setRecordStatus("等你开口");
  updateRecordUI();
  cleanupRealtime(true);
}

function cleanupRealtime(closeSession = false) {
  clearInterval(state.timer);
  state.timer = null;
  clearTimeout(state.responseTimer);
  state.responseTimer = null;
  stopAudioCapture();
  if (state.realtime?.readyState === WebSocket.OPEN) {
    if (closeSession) sendRealtime({ type: "session.close" });
    state.realtime.close();
  }
  state.realtime = null;
  state.recording = false;
}

function sendRealtime(payload) {
  if (state.realtime?.readyState === WebSocket.OPEN) state.realtime.send(JSON.stringify(payload));
}

async function parseRealtimeMessage(data) {
  try {
    const text = typeof data === "string" ? data : await data.text();
    return JSON.parse(text);
  } catch { return null; }
}

function extractEventText(payload) {
  return String(payload.delta || payload.text || payload.transcript || payload.item?.content?.[0]?.text || payload.item?.content?.[0]?.transcript || "");
}

// 豆包转写 delta 可能是增量片段，也可能是包含前文的累计快照；统一只保留一次文本。
function mergeTranscript(existing, incoming) {
  const current = String(existing || "");
  const next = String(incoming || "");
  if (!next) return current;
  if (!current) return next;
  // 服务端可能先发较长的累计快照，再补发较短的完成片段；短片段已包含在当前文本中时直接忽略。
  if (next === current || current.startsWith(next) || current.endsWith(next)) return current;
  if (next.startsWith(current)) return next;
  const maxOverlap = Math.min(current.length, next.length);
  for (let size = maxOverlap; size > 0; size -= 1) {
    if (current.slice(-size) === next.slice(0, size)) return current + next.slice(size);
  }
  return current + next;
}

function cleanTranscript(value) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  // 清理 ASR 偶发的连续整句/长短语复制；保留“哈哈”“妈妈妈妈”等自然短重复。
  for (let pass = 0; pass < 3; pass += 1) {
    let changed = false;
    for (let size = Math.floor(text.length / 2); size >= 4; size -= 1) {
      for (let index = 0; index + size * 2 <= text.length; index += 1) {
        const block = text.slice(index, index + size);
        if (new Set(block.replace(/[，。！？、；：,.!?\s]/g, "")).size < 2) continue;
        if (block === text.slice(index + size, index + size * 2)) {
          text = text.slice(0, index + size) + text.slice(index + size * 2);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (!changed) break;
  }
  return text.replace(/([，。！？、；：,.!?])\1+/g, "$1");
}

function resamplePcm16(input, sourceRate, targetRate) {
  if (sourceRate === targetRate) return Int16Array.from(input, sample => Math.max(-1, Math.min(1, sample)) * 0x7fff);
  const ratio = sourceRate / targetRate;
  const output = new Int16Array(Math.max(1, Math.round(input.length / ratio)));
  for (let i = 0; i < output.length; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j += 1) sum += input[j];
    const sample = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }
  return output;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function queuePcmAudio(base64) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  if (!state.playbackContext) state.playbackContext = new AudioContextClass({ sampleRate: 24000 });
  await state.playbackContext.resume();
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const view = new DataView(bytes.buffer);
  // Realtime PCM 帧实际为 little-endian Float32；按 Int16 播放会变成爆音。
  // 保留 Int16 兜底，兼容服务端切换为 pcm_s16le 的情况。
  const floatCount = Math.floor(bytes.length / 4);
  const floatSamples = new Float32Array(floatCount);
  let floatLooksValid = floatCount > 0;
  for (let i = 0; i < floatCount; i += 1) {
    const sample = view.getFloat32(i * 4, true);
    if (!Number.isFinite(sample) || Math.abs(sample) > 1.25) floatLooksValid = false;
    floatSamples[i] = Math.max(-1, Math.min(1, Number.isFinite(sample) ? sample : 0));
  }
  const samples = floatLooksValid ? floatSamples : new Float32Array(Math.floor(bytes.length / 2));
  if (!floatLooksValid) {
    for (let i = 0; i < samples.length; i += 1) samples[i] = view.getInt16(i * 2, true) / 32768;
  }
  const buffer = state.playbackContext.createBuffer(1, samples.length, 24000);
  buffer.copyToChannel(samples, 0);
  const source = state.playbackContext.createBufferSource();
  source.buffer = buffer;
  source.connect(state.playbackContext.destination);
  const startAt = Math.max(state.playbackContext.currentTime + .03, state.playbackAt || 0);
  source.start(startAt);
  state.playbackAt = startAt + buffer.duration;
}

function setRecordStatus(text) {
  const label = document.querySelector("#recordState");
  if (label) label.textContent = text;
}

async function handleMessage(text) {
  const heard = document.querySelector("#heard");
  const reply = document.querySelector("#reply");
  if (!heard || !reply) return;
  heard.innerHTML = `我听见你说：<strong>“${escapeHtml(text)}”</strong>`;

  const safety = matchSafety(text);
  if (safety) {
    state.reply = safety.response;
    setReplyText(reply, state.reply);
    showSafety(safety.action);
    return;
  }

  state.mockIndex += 1;
  setReplyText(reply, "", true);
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: state.role,
        text,
        history: state.history.slice(-6),
        customRole: state.role === "custom" ? {
          name: roles.custom.name,
          relation: roles.custom.relation,
          personality: roles.custom.personality,
          catchphrase: roles.custom.catchphrase
        } : undefined
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    // Demo/真实接口都优先使用服务端根据当前输入生成的回复，不能再按轮次覆盖成无关台词。
    state.reply = data.reply || contextualReply(state.role, text, roles[state.role].intro);
  } catch {
    state.reply = getMockReply(state.role, text, state.history) || contextualReply(state.role, text, roles[state.role].intro);
  }
  state.history.push({ role: "user", content: text }, { role: "assistant", content: state.reply });
  state.history = state.history.slice(-6);
  setReplyText(reply, state.reply);
  if (state.sound) speak(state.reply);
}

function setReplyText(reply, text, thinking = false) {
  const textNode = reply.querySelector(".reply-text");
  if (textNode) textNode.textContent = text;
  reply.classList.toggle("is-thinking", thinking);
}

function contextualReply(role, text, fallback) {
  if (/睡|夜里|失眠|醒/.test(text)) {
    return role === "mama" ? "夜里一次次醒，身体怎么会不累。先靠一会儿，能交给别人一次的夜醒，就不要再一个人硬撑。" :
      role === "duomi" ? "妈妈辛苦啦。现在不用想明天，我们把眼睛闭一小会儿，我陪着你。" :
      "一次次醒来真的太消耗人了。今晚不聊坚强，我陪你吐槽，也陪你找一件能少做的事。";
  }
  if (/没人|不理解|委屈|辛苦/.test(text)) {
    return role === "mama" ? "英姐知道，你最难受的不只是累，而是这么辛苦却没人看见。你先靠一会儿，不用向我证明什么。" :
      role === "duomi" ? "妈妈，我知道你很辛苦。你不开心的时候也还是我最喜欢的妈妈，抱抱你。" :
      "这也太委屈了。你不是矫情，是承担了很多却没人认真看见；今天我先无条件站你这边。";
  }
  return fallback;
}

function showSafety(action = "checkSafety") {
  if (document.querySelector(".safety-sheet")) return;
  const copy = SAFETY_COPY[action] || SAFETY_COPY.checkSafety;
  const sheet = document.createElement("section");
  sheet.className = "safety-sheet";
  sheet.innerHTML = `<h2>${copy.title}</h2>
    <p>${copy.body}</p>
    <button class="safety-primary" id="callTrusted">我现在联系一个人</button>
    <button class="safety-secondary" id="closeSafety">暂时关闭</button>`;
  document.body.append(sheet);
  sheet.querySelector("#callTrusted").addEventListener("click", () => {
    showToast("请现在拨打家人、朋友或专业支持人员的电话");
  });
  sheet.querySelector("#closeSafety").addEventListener("click", () => sheet.remove());
}

let activeAudio = null;
let activeAudioUrl = "";

async function speak(text) {
  window.speechSynthesis?.cancel();
  // 小多米的奶气萌娃音色只在实时资源上可用，跳过会必然返回资源不匹配的 HTTP TTS。
  if (state.role !== "duomi") {
    try {
      // 普通回复优先使用豆包 HTTP TTS：MP3 在 iPhone 上兼容性更稳定；实时 PCM 仅作为备用。
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role: state.role, text })
      });
      if (!response.ok) throw new Error("tts http failed");
      const blob = await response.blob();
      if (activeAudioUrl) URL.revokeObjectURL(activeAudioUrl);
      activeAudioUrl = URL.createObjectURL(blob);
      activeAudio = new Audio(activeAudioUrl);
      await activeAudio.play();
      return;
    } catch {
      // HTTP TTS 不可用时再尝试实时 PCM。
    }
  }
  try {
    await speakWithRealtime(text);
    return;
  } catch {
    // 实时语音不可用时继续使用系统语音。
  }

  if (!("speechSynthesis" in window)) return showToast("当前浏览器暂不支持语音播放");
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = state.role === "mama" ? 1.2 : state.role === "yingjie" ? 1.1 : 1;
  utterance.pitch = state.role === "mama" ? .92 : state.role === "duomi" ? 1.18 : 1;
  window.speechSynthesis.speak(utterance);
}

async function speakWithRealtime(text) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) throw new Error("audio unsupported");
  if (!state.playbackContext) state.playbackContext = new AudioContextClass({ sampleRate: 24000 });
  await state.playbackContext.resume();
  state.playbackAt = state.playbackContext.currentTime + .03;

  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${location.host}/api/realtime`);
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("realtime tts timeout"));
    }, 20000);
    ws.addEventListener("message", async event => {
      const payload = await parseRealtimeMessage(event.data);
      if (!payload) return;
      if (payload.type === "proxy.ready") {
        ws.send(JSON.stringify(buildRealtimeSession()));
      } else if (payload.type === "session.created") {
        ws.send(JSON.stringify({ type: "speech_text_buffer.commit", text }));
      } else if (payload.type === "response.output_audio.delta") {
        const audio = payload.delta || payload.audio || payload.data;
        if (audio) await queuePcmAudio(audio);
      } else if (payload.type === "response.output_audio.done") {
        clearTimeout(timeout);
        ws.send(JSON.stringify({ type: "session.close" }));
        ws.close();
        resolve();
      } else if (payload.type === "proxy.error" || payload.type === "error") {
        clearTimeout(timeout);
        ws.close();
        reject(new Error("realtime tts failed"));
      }
    });
    ws.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("realtime tts connection failed"));
    }, { once: true });
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);
}

restoreCustomRole();
preloadVisualAssets();
renderHome();
