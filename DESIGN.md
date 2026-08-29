---
name: "抱抱她"
description: "为手机端 AI 陪伴体验提供温暖、圆润且低压力的视觉系统。"
colors:
  canvas: "#fff9f3"
  surface: "#fffcf8"
  surface-muted: "#f8f3ef"
  ink: "#2f2b58"
  muted: "#716a78"
  line: "#ede3dc"
  blue: "#88a9d2"
  blue-soft: "#eaf3f8"
  coral: "#eca47e"
  coral-soft: "#fff0e5"
  rose: "#dfa2af"
  rose-soft: "#fcecef"
  violet: "#9c8ee8"
  violet-soft: "#f0ecff"
  safe: "#6f927c"
  danger: "#453b62"
typography:
  display:
    fontFamily: '"Songti SC", "Noto Serif SC", STSong, serif'
    fontSize: "clamp(29px, 8vw, 34px)"
    fontWeight: 700
    lineHeight: 1.28
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Songti SC", "Noto Serif SC", STSong, serif'
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Songti SC", "Noto Serif SC", STSong, serif'
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif'
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.45
rounded:
  field: "14px"
  control: "17px"
  card: "20px"
  feature: "28px"
  pill: "999px"
  circle: "50%"
spacing:
  "4": "4px"
  "8": "8px"
  "10": "10px"
  "12": "12px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "54px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    height: "54px"
  input-text:
    backgroundColor: "#faf7f4"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 13px"
    height: "48px"
  card-form:
    backgroundColor: "rgba(255, 252, 248, 0.9)"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "18px"
  card-plan:
    backgroundColor: "rgba(255, 252, 248, 0.84)"
    textColor: "{colors.ink}"
    rounded: "16px"
    padding: "12px"
    height: "88px"
  card-plan-selected:
    backgroundColor: "#f4f0ff"
    textColor: "{colors.ink}"
    rounded: "16px"
    padding: "12px"
    height: "88px"
---

# Design System: 抱抱她

## Overview

**Creative North Star: "柔软的关系客厅"**

界面像一个可以先坐下、再慢慢开口的手机端小客厅。暖米白底色与雾粉、浅蓝、淡紫一起降低压力，深蓝紫文字保留可读性；圆润插画、柔和渐变与轻阴影用于建立“有人接住你”的关系感。

这是 Operate 模式下的低认知负担系统：首要信息与操作都在单栏移动容器内顺序展开，定制角色先给实时预览，会员流程保留免费试聊出口。系统不使用冷硬高对比面板，也不用过度密集的配置语言。

**Key Characteristics:**

- 暖米白底色与低饱和关系色。
- 宋体标题搭配系统黑体正文。
- 以 14–30px 圆角为主的软性几何。
- 卡片依靠色层和低透明阴影分层。
- 围绕 430px 手机画布、安全区与单手操作设计。
- 角色插画和实时预览承担记忆点，而非额外装饰。

## Colors

色彩以暖米白为纸面，以淡紫、浅蓝、雾粉和珊瑚色区分关系氛围，所有强调色都保持低饱和。

### Primary

- **深蓝紫墨色** (`ink`, #2f2b58)：主文字、深色主按钮与发送控件，提供全局可读性锚点。
- **雾紫** (`violet`, #9c8ee8)：品牌标识、模式状态和关系感强调；完整区域优先使用对应的淡紫底。

### Secondary

- **柔雾蓝** (`blue`, #88a9d2)：冷静、倾听类角色与品牌渐变的次色。
- **温珊瑚** (`coral`, #eca47e)：补充温度和活力，用在渐变或小面积装饰中。
- **软雾粉** (`rose`, #dfa2af)：用于温柔、孩子感或晚安类的角色底色。

### Neutral

- **暖米白画布** (`canvas`, #fff9f3)：所有屏幕的底色和光感基底。
- **乳白表面** (`surface`, #fffcf8)：角色卡、表单卡和弹层的主表面。
- **暖灰表面** (`surface-muted`, #f8f3ef)：次级操作与安静的对比底。
- **暖灰文字** (`muted`, #716a78)：说明、标注、次级按钮与辅助文字。
- **暖纸分隔线** (`line`, #ede3dc)：输入框与局部容器的低对比边界。
- **柔蓝底** (`blue-soft`, #eaf3f8)、**珊瑚底** (`coral-soft`, #fff0e5)、**雾粉底** (`rose-soft`, #fcecef)、**淡紫底** (`violet-soft`, #f0ecff)：作为角色场景和状态色的大面积低对比承载层。
- **安全绿** (`safe`, #6f927c)：实时连接等正向状态。
- **安全分流深紫** (`danger`, #453b62)：高风险内容分流中的稳定主操作，不使用鲜红制造额外紧张。

### Named Rules

**The Soft Field Rule.** 强调色尽量作为渐变、状态点或浅色容器出现，不铺成高饱和大色块。

**The Calm Safety Rule.** 风险流程用更深的紫色提升权重，而非警报式鲜红。

## Typography

**Display Font:** Songti SC（Noto Serif SC / STSong 回退）  
**Body Font:** 系统无衬线字体（PingFang SC / Noto Sans SC 回退）

**Character:** 宋体为标题、角色姓名和对话内容增加人情味，系统黑体负责输入、状态和操作的快速读取。

### Hierarchy

- **Display** (700, 29–34px, 1.28): 屏幕主题，使用 `clamp(29px, 8vw, 34px)` 在手机宽度间渐进缩放。
- **Headline** (700, 27px, 1.3): 会员价值主张等局部标题。
- **Title** (700, 17px, 1.3): 顶栏、卡片标题、角色姓名与表单分区。
- **Body** (400, 14px, 1.65): 说明文字、表单内容和用户输入。
- **Label** (600, 12px, 1.45): 字段标签、状态文字、角色标签和辅助操作。

### Named Rules

**The Human Voice Rule.** 只在有人情味的内容——标题、角色姓名、对话和价格——中使用宋体；表单和操作始终使用系统黑体。

## Layout

页面是一个居中的单栏移动容器，最大宽度为 430px，高度至少为 `100dvh`。桌面窗口上保留外层暖灰底色和容器环境阴影；手机上容器占满宽度。

屏幕水平内边距固定为 20px，顶部与底部使用 `env(safe-area-inset-*)` 保护 iPhone 安全区。主要垂直节奏由 8、10、12、16、18 和 20px 组成：控件内部更紧，卡片与分区之间更松。定制页依次排列实时预览、身份、外观、人设和会员说明；会员页使用双列方案卡，其余内容保持单列。

当视口高度不超过 760px 时，顶部边距、角色卡和对话场景紧凑处理，但保留 44px 最小次要操作高度、48–56px 表单与主操作高度。

**The One-Hand Rule.** 主操作必须保持全宽、54px 以上的触控高度，流程不依赖横向滚动。

## Elevation & Depth

系统采用“浅色层 + 低透明紫灰阴影”的混合分层。主场景和特征预览使用较广、较柔的阴影；表单卡、图标按钮和语音气泡使用更轻的局部阴影。半透明乳白面板可搭配背景色层，对话气泡另使用 16px 模糊的玻璃感。

### Shadow Vocabulary

- **环境容器** (`0 0 80px rgba(51, 39, 64, .1)`): 仅在大于 430px 的外层窗口中显示手机画布边界。
- **特征卡** (`0 18px 48px rgba(66, 50, 82, .1)`): 角色主卡和对话场景的统一高层级。
- **表单卡** (`0 10px 28px rgba(66, 50, 82, .065)`): 定制表单分区的低对比浮层。
- **定制预览** (`0 18px 42px rgba(66, 50, 82, .11)`): 实时角色预览的聚焦层级。
- **主操作柔彩** (`0 15px 30px rgba(92, 107, 210, .25)`): 只用于首页与语音主操作的蓝紫渐变。

### Named Rules

**The Soft Lift Rule.** 阴影只用来区分可操作容器和聚焦场景，颜色必须延续紫灰基调，不使用纯黑硬阴影。

## Shapes

几何语言以软性大圆角为主。输入框与小选项使用 14–16px，主按钮使用 17–20px，表单卡和角色卡使用 20–28px，场景可达 30px。图标按钮、头像、语音按钮和状态点使用正圆或胶囊。品牌标识通过一个 4px 的异形角保留“对话气泡”轮廓。

边框一般为 1px 低透明纸灰或白色，仅定制角色入口使用虚线表示“尚未建立”，选中态则用紫色边界加轻微外环。人物插画与定制头像始终裁切在稳定轮廓中，加载前也保留尺寸。

**The Soft Geometry Rule.** 新容器先复用 14、17、20 或 28px 这四个主圆角，不为普通卡片添加新的一次性圆角。

**The Shared Character Baseline Rule.** 聊天页默认人物统一为 294px 高、底部 38px，头顶约留 18px；矮屏统一为 264px 高、底部 32px。英姐、沈有才与小多米仅按源图视觉重心使用角色专属水平偏移，不通过改变人物高度或垂直位置校正。

**The Top-Anchored Thumbnail Rule.** 角色选择页缩略图始终顶部锚定并完整等比缩放，由固定裁切容器隐藏底部溢出；水平位置按各自源图的视觉重心微调。

## Components

### Buttons

- **Shape:** 全宽主操作使用柔和大圆角（17–20px），图标和语音操作使用正圆或胶囊。
- **Primary:** 表单、会员与安全流程使用深蓝紫墨色按钮，高度 54px；首页和语音主操作可使用蓝紫渐变与柔彩阴影。
- **Active / Focus:** 按下缩放至 0.985；键盘聚焦显示 3px 半透明蓝色外轮廓与 2px 偏移。
- **Secondary:** 使用透明或半透明乳白底、暖灰文字，不与主按钮争夺注意力。

### Chips

- **Style:** 模式状态用 999px 胶囊；聊天背景选择器使用三列 14px 圆角选项，上方展示 48px 颜色预览。
- **State:** 选中态用紫色 1px 边框与 2px 低透明外环，并同步 `aria-pressed`。

### Cards / Containers

- **Corner Style:** 普通表单卡 20px，会员角色预览 24px，定制实时预览 28px，对话场景 30px。
- **Background:** 乳白或暖米白半透明面板；特征卡使用淡紫、浅蓝、雾粉渐变。
- **Shadow Strategy:** 表单卡使用低层级局部阴影，实时预览和对话场景使用特征卡阴影。
- **Border:** 低对比 1px 边界；定制入口可用淡紫虚线。
- **Internal Padding:** 表单卡 18px，会员预览 20px，主角色卡 21px。

### Inputs / Fields

- **Style:** 暖米灰底、1px 低对比紫灰边框、14px 圆角；单行高度 48px，多行最小高度 108px。
- **Focus:** 边框转为半透明紫色，并显示 3px 淡紫聚焦环。
- **Limits:** 名字、关系、人设和口头禅都显式限制长度；头像上传使用可读标签并保持原生文件输入可访问。

### Navigation

顶栏高度至少 44px，返回、隐私和声音操作使用 44px 正圆按钮、半透明白色底与轻阴影。中心标题用宋体，次行状态用 11px 暖灰系统黑体。图标按钮必须有可读的 `aria-label`。

### Character Artwork

聊天场景中的三位默认角色共用人物基线：常规场景高 294px、底部 38px，矮屏场景高 264px、底部 32px；图片使用 `contain` 并以底部为垂直锚点。常规场景从容器水平中心向左偏移：英姐 3px、沈有才 21px、小多米 1px；矮屏时分别为 3px、19px、1px，以补偿不同源图的视觉重心。

角色选择页缩略图以顶部为锚点并完整 `contain`，由固定宽度的裁切容器隐藏超出卡片高度的底部；每个角色继续使用与源图匹配的专属水平偏移，不强行按透明画布几何居中。

### Custom Role Preview

定制页的特征组件是 28px 圆角实时预览卡。它包含 112px 圆形头像、宋体角色名和口头禅，在用户输入名字、口头禅或切换“晨光 / 花园 / 晚安”背景时即时更新。头像缺失时使用角色名首字占位，占位尺寸与真实头像一致。

### Membership Plan

会员方案使用两张等宽、16px 圆角、88px 最小高度的选项卡。价格用宋体强调，“比赛示意价”和“不会真实扣款”始终显示；选中态使用淡紫底、紫色边界和轻微外环。主按钮后必须保留“暂不保存，先试聊一次”的次级出口。

## Do's and Don'ts

### Do:

- **Do** 在新屏幕中复用暖米白画布、乳白表面和深蓝紫文字的主层级。
- **Do** 让角色和人情味文字使用宋体，让表单与操作使用系统黑体。
- **Do** 保持 430px 最大容器、20px 水平边距、安全区内边距和 44px 以上触控目标。
- **Do** 在角色切换与矮屏适配中保持共享人物基线，只使用既定的角色专属水平偏移校正视觉重心。
- **Do** 在定制角色中优先展示实时预览，并让头像占位与实际图片保持尺寸一致。
- **Do** 对键盘焦点、选中态和实时连接同时提供颜色之外的轮廓、文字或 `aria-pressed`。

### Don't:

- **Don't** 引入第二套冷硬的后台式或高饱和视觉语言。
- **Don't** 用纯黑硬阴影、小直角卡片或高对比边框破坏柔软层级。
- **Don't** 把价格、折扣或会员权益写成已验证的商业事实，也不得隐藏比赛示意和不真实扣款说明。
- **Don't** 让付费路径阻断试聊，或将次要出口降低到不可读。
- **Don't** 依赖动画传达必要状态；用户偏好减少动效时必须停止循环动画。
