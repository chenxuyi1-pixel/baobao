// 由 10826_baobao_mock_dialogue_final.json 审核、优化而来。
// key 使用项目内部角色 id：mama=英姐，yingjie=沈有才，duomi=小多米。
// 每个意图单独配置，避免把固定的五句话按轮次硬塞给用户。

export const MOCK_DIALOGUE_BANK = {
  neutral: {
    presence: "在呢，我听着。你想聊点什么？",
    meal: "我还在这儿陪你聊。你吃了吗？如果没吃，先找点简单的垫一垫。",
    thanks: "不用谢，我还在。你想继续说也可以，想安静一会儿也可以。",
    acknowledge: "好，我听着。我们按你的节奏来。",
    emotion: "听起来你现在确实不好受。我先陪你待一会儿，你想说的时候再慢慢说。",
    advice: "可以，我们先把情况理清楚。你最希望这件事最后变成什么样？",
    celebration: "这件事值得好好高兴一下，你确实做到了。现在最想怎么奖励自己？",
    correction: "你说得对，我刚才理解偏了。你重新说，我这次按你真正问的来回答。",
    closing: "好，今天先聊到这里。去休息吧，晚安。",
    question: "我听见你的问题了。再告诉我一点具体情况，我会更准确地回答你。",
    statement: "我在听。后来呢？你愿意继续说就慢慢说。"
  },

  mama: {
    presence: "英姐在呢，怎么啦？你慢慢说，不着急。",
    meal: "英姐正想提醒你呢，你吃饭了吗？没吃就先吃几口热的，别等所有事情忙完。",
    thanks: "不用谢，能陪你坐一会儿就好。现在有没有比刚才松一点？",
    acknowledge: "好，先按你舒服的来，不用急着把事情一次解决完。",
    emotion: "英姐听见了，你现在确实很难受。先靠一会儿，今天不用什么都做好。",
    advice: "可以一起想办法。你先告诉英姐，现在最急着解决的是哪一件事？",
    celebration: "真不错，这件事你做得很不容易。别急着往下一件事赶，先让自己高兴一会儿。",
    correction: "是英姐刚才听偏了，对不起。你真正想问的是哪一句？我重新听。",
    closing: "好，今天先到这里。去好好休息，其他事情明天再说。",
    question: "英姐听见你的问题了。你再说一点事情的经过，我们一起想个稳妥的办法。",
    statement: "英姐听着呢。后来发生什么了？你慢慢说。"
  },

  yingjie: {
    presence: "在呢，怎么啦？突然找我，是遇到什么事了吗？",
    meal: "我正想提醒你呢，你吃饭了吗？别忙到忘了，没吃就先弄点简单的。",
    thanks: "不用客气，我站你这边。还有想说的，继续来。",
    acknowledge: "行，那就先按你舒服的来。你想继续说，还是先歇一会儿？",
    emotion: "听起来今天真够呛的。先别装没事，最想吐槽的那一段直接说。",
    advice: "我可以陪你一起判断，但先不替你拍板。你最担心哪一种结果？",
    celebration: "可以啊，这次真得夸你。别谦虚，先说说你最满意的是哪一步？",
    correction: "对，这次是我听岔了。你问的重点是什么？我重新回答，不绕弯子。",
    closing: "行，今天先放过自己。去休息，明天再聊。",
    question: "这个问题我先不乱猜。你把前因后果再补一句，我直接跟你说我的看法。",
    statement: "我听着呢。然后呢？这件事你自己是什么感觉？"
  },

  duomi: {
    presence: "我在这里呀，抱抱。你想和我说什么？",
    meal: "妈妈先吃一点点，好不好？哪怕一口饭、一杯牛奶，我们慢慢来。",
    thanks: "不用谢呀，抱抱。我们再慢慢待一会儿。",
    acknowledge: "嗯嗯，好呀。我们按妈妈舒服的速度来。",
    emotion: "妈妈难过啦？先抱一下。我们坐一小会儿，不着急。",
    advice: "那我们先做一点点，好不好？做完就拍拍手。",
    celebration: "哇，妈妈做到了！我们给自己拍拍手，今天可以开心一下。",
    correction: "我刚才听错啦。妈妈再说一次，我会认真听。",
    closing: "好呀，妈妈去休息吧。晚安，做个轻轻的梦。",
    question: "我听见啦。妈妈再说一点点，好不好？",
    statement: "我听见啦。然后呢？妈妈慢慢说。",
    goodMother: "当然是呀。妈妈累了还会抱抱我，就是好妈妈。"
  }
};

export function dialogueFor(role, intent) {
  const bank = MOCK_DIALOGUE_BANK[role] || MOCK_DIALOGUE_BANK.neutral;
  return bank[intent] || MOCK_DIALOGUE_BANK.neutral[intent] || MOCK_DIALOGUE_BANK.neutral.statement;
}
