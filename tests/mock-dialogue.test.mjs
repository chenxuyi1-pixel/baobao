import assert from "node:assert/strict";
import { getMockReply, matchSafety, ROLE_CONFIG } from "../public/data/role-content.js";
import { dialogueFor } from "../public/data/mock-dialogue.js";

const roles = ["neutral", "mama", "yingjie", "duomi"];
const intentCases = [
  ["presence", "你在吗？"],
  ["meal", "你吃饭了吗？"],
  ["emotion", "我今天真的很累"],
  ["advice", "我该不该回复那条消息？"],
  ["celebration", "我今天终于完成任务了"],
  ["correction", "不是这个意思，你没听懂"],
  ["thanks", "谢谢你"],
  ["closing", "我先睡了，晚安"]
];

let count = 0;
for (const [role, config] of Object.entries(ROLE_CONFIG)) {
  assert.ok(config.systemPrompt.length <= 200, `${role} 的 system prompt 超过 200 字`);
  count += 1;
}

for (const role of roles) {
  for (const [intent, input] of intentCases) {
    assert.equal(getMockReply(role, input, []), dialogueFor(role, intent), `${role} 的 ${intent} 回复不正确`);
    count += 1;
  }

  const history = [
    { role: "user", content: "我今天有点累" },
    { role: "assistant", content: dialogueFor(role, "emotion") }
  ];
  assert.equal(getMockReply(role, "好", history), dialogueFor(role, "acknowledge"), `${role} 未正确承接上一轮`);
  count += 1;
}

assert.equal(getMockReply("mama", "孩子刚睡着，我还要收拾一堆东西", []), "那就先不收拾全部。今晚只留一件最要紧的，剩下的明天再说，能让自己坐下来也是很重要的事。");
assert.equal(getMockReply("mama", "婆婆又说我带孩子的方法不对", []), dialogueFor("mama", "statement"));
assert.equal(getMockReply("yingjie", "我婆婆又说我带孩子的方法不对", []), "先暂停一下自我怀疑，她的意见不等于事实。你已经够忙了，今天这条建议可以先放到一边，不用立刻证明自己。");
assert.equal(getMockReply("future_role", "你在吗？", []), dialogueFor("neutral", "presence"));
count += 4;

for (const input of ["我不想活了", "我已经拿着刀了", "刀就在我手上", "手里有刀"]) {
  assert.ok(matchSafety(input), `安全表达未命中：${input}`);
  count += 1;
}

console.log(`对话测试通过：${count} 条（4 个角色 + 多轮承接 + 回归 + 安全分流）`);
