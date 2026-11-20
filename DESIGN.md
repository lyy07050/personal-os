---
name: my little os.
description: 手绘粉绿风 v3 · 淡薄荷纸张上的白卡片和拼贴贴纸
colors:
  card-tint: "#f8fbf9"
  deep-green: "#3e5b4b"
  text-primary: "#252d29"
  text-secondary: "#677168"
  text-brown: "#a66b53"
  tag-pink: "#fdefee"
  tag-blue: "#ecf8fe"
  tag-yellow: "#fef7e0"
  tag-purple: "#f3f0f4"
  tag-apricot: "#e9e7e6"
  tag-green: "#dfe8db"
  tag-beige: "#f2e8d3"
  module-yellow: "#fef7de"
  module-blue: "#f4f8fe"
  surface: "#ffffff"
  page-bg: "#f0f5f2"
  page-paper: "#ebf2ed"
  text-body: "#4f5c52"
  text-table: "#303a33"
  tab-inactive: "#737e74"
  warning: "#a15c46"
  chip-pink-text: "#945b47"
  progress-done: "#8fa98a"
  outline-empty: "#a9b4a4"
typography:
  display:
    fontFamily: "ZCOOL KuaiLe, sans-serif"
    fontSize: "60px"
    fontWeight: 400
  headline:
    fontFamily: "ZCOOL KuaiLe, sans-serif"
    fontSize: "30px"
    fontWeight: 400
  title:
    fontFamily: "ZCOOL KuaiLe, sans-serif"
    fontSize: "24px"
    fontWeight: 400
  tab-latin:
    fontFamily: "Gaegu, cursive"
    fontSize: "40px"
    fontWeight: 700
  number:
    fontFamily: "Gaegu, cursive"
    fontSize: "48px"
    fontWeight: 700
  body:
    fontFamily: "Noto Sans SC, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  caption:
    fontFamily: "Noto Sans SC, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "Noto Sans SC, sans-serif"
    fontSize: "16px"
    fontWeight: 500
  mono:
    fontFamily: "DM Mono, monospace"
    fontSize: "16px"
    fontWeight: 400
  greeting:
    fontFamily: "Playfair Display, serif"
    fontSize: "72px"
    fontWeight: 700
rounded:
  banner: "4px"
  checkbox: "4px"
  tile: "16px"
  card: "22px"
  tab-pill: "30px"
  phone: "56px"
  pill: "999px"
spacing:
  gap: "24px"
  section: "36px"
  page-right: "40px"
components:
  button-primary:
    backgroundColor: "{colors.deep-green}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  chip:
    backgroundColor: "{colors.tag-pink}"
    textColor: "{colors.chip-pink-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
  tile:
    backgroundColor: "{colors.card-tint}"
    rounded: "{rounded.tile}"
  search:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    width: "270px"
    height: "52px"
  tab-pill:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.tab-pill}"
    height: "68px"
---

# Design System: my little os.

> 本文件由 `docs/2026-11-19-ui-design-spec.md` 第 1–7 节整理而来（2026-11-19）。
> **Figma 是唯一的视觉依据**：https://www.figma.com/design/sDcsDbWq3AyNq2RnurREqo 。改设计时先改 Figma，再更新 spec，最后同步这里。每一页的详细说明见 spec 第 6 节，这里不重复。

## Overview

**Creative North Star: "薄荷纸手账"**

像一本贴满拼贴贴纸的手账：淡薄荷色的纸上放着白色卡片，大字是有点笨拙的方正手写体，小字是干净的黑体。精细的水彩或实物插画（花、猫、瓷器、食物、文具）从卡片边缘探出去，给每页一点手作感，有一点韩系手绘的元素，比如奶茶店的微信小程序的设计，参考喜茶，另外加上一些从pinterest找的古风，可爱插画，增加一点优雅又带点俏皮可爱的感觉。

整体安静、好读。颜色只做轻提示：分类色都是很浅的底色，深绿只用在主按钮、勾选、大数字和当前选中上。内容只写事实（日期、数量、截止时间），不写口号。UI是用大标题或者设计就能让user知道这个feature的用法，不要用小字提示才能让user知道怎么用，如果必须要用小字，请你不要做复述标题（标题说过的，再说一遍），免责声明（每张卡片都挂一遍），按钮提示（ex：点击下方按钮即可），以及模块说明（每个数字下面一句解释）这些。

**Key Characteristics:**
- 淡薄荷纸张背景 + 白色卡片，对比靠明度而不是颜色
- 大字手写（ZCOOL KuaiLe / Gaegu），小字黑体（Noto Sans SC）
- 极浅的分类色，单一深绿强调色
- 插画是带阴影的贴纸，每页最多 1–2 张，可以超出卡片
- 柔和的双层阴影，圆角，高级简约的模块设计

## Colors

淡薄荷纸 + 白卡片 + 一个深绿强调色，分类色全部压到很浅。

### Primary
- **深绿** (#3e5b4b)：主按钮、勾选后的填充、大数字、当前选中。全页唯一的深色强调。

### Neutral
- **淡薄荷纸** (#ebf2ed 加 Noise 纹理，画板底色 #f0f5f2)：页面背景。不是白、不是米、不是黄。
- **白** (#ffffff)：版块卡片、顶栏药丸、搜索框。
- **卡片浅底** (#f8fbf9)：分组底板里的小卡片和方块。
- **文字/主** (#252d29)：标题和正文主色。
- **卡片正文** (#4f5c52) / **表格正文** (#303a33)：卡片和表格里的正文。
- **文字/次** (#677168)：说明、日期、标签名。小字不能比它更浅。
- **未选中 tab** (#737e74)。
- **文字/棕** (#a66b53)：数量角标、品牌里的 `os.`。

### 分类色（标签色）
很浅的底色，用在 chip、分类方块、物品图片占位区、食物墙方块：

| 名称 | 色值 | 例子 |
|---|---|---|
| 粉 | #fdefee | 电子、变美、小红书 |
| 蓝 | #ecf8fe | 衣物、多伦多生活 |
| 黄 | #fef7e0 | 厨房、回国吃喝玩乐 |
| 紫 | #f3f0f4 | 书、学习、抖音 |
| 杏 | #e9e7e6 | 证件、求职 |
| 绿 | #dfe8db | 网页、体态、交通 |
| 米 | #f2e8d3 | 课堂、生活小知识 |

模块底色：**淡黄** #fef7de（首页「最近的活动」）、**淡蓝** #f4f8fe（首页「Reminder」）。

### 状态色
- **警示** (#a15c46)：明天过期、今晚截止、超预算比例。只用于真正需要注意的内容。
- **粉 chip 文字** (#945b47)。
- **进度已完成** (#8fa98a)。
- **空勾选框 / 虚线** (#a9b4a4)。

### Named Rules
**The 轻提示 Rule.** 分类色只做底色提示，不做大面积饱和色块。深绿是唯一的深色强调。

**The 样式联动 Rule.** 标签色同时用在小 chip 和大色块上，改一个样式两类一起变。只想改其中一类时，先拆成两套样式。

## Typography

**Display Font:** ZCOOL KuaiLe 站酷快乐体（中文大字）
**Latin Display:** Gaegu Bold（英文 tab、数字、品牌）
**Body Font:** Noto Sans SC
**Mono:** DM Mono（金额、文件类型）
**Serif（限定）:** Playfair Display + Crimson Text，只用在首页 banner 和教务处课程卡

**Character:** 大字笨拙、有手写的温度；小字克制、清楚。两者反差就是这套风格的辨识度。

### Hierarchy
- **页面大标题**（ZCOOL KuaiLe 60）：财务部、食物墙。
- **版块标题**（ZCOOL KuaiLe 30，首页 26）：账单流水、错词本。
- **卡片标题**（ZCOOL KuaiLe 24–27）：降噪耳机、一周备餐。
- **视图切换 tab**（英文 Gaegu Bold 40 / 中文 ZCOOL KuaiLe 40）。
- **大数字**（Gaegu Bold 48–100）：$812.40、23 天。
- **正文**（Noto Sans SC Regular 16–21）：列表、表格。
- **说明 / 小字**（Noto Sans SC Regular 12–18，文字/次）：日期、来源。
- **眉标**（Noto Sans SC Medium 16，字间距加宽）：`40 · NOTES`。
- **数量角标**（Noto Sans SC Medium 16，文字/棕）：只用在侧栏，例如「知识库 38」。顶部 tab 不加。
- **金额 / 文件类型**（DM Mono 16–20）。
- **首页问候**（Playfair Display Bold 72）：Hi Charlotte 👋；日期行 Crimson Text SemiBold 34，日期数字 Gaegu Bold。
- **日历数字、✓**（Inter）。

### 手机版标题（2026-11-19 定）
手机版不用手写体，标题和数字一律 **Noto Sans SC SemiBold（600）**，字间距 -0.02em，数字用等宽数字（tabular-nums）。只有品牌 `my little os.` 保留 Gaegu。原因：手机屏幕小，干净的无衬线标题更显高级、更好读。网页版暂时保持手写标题。

| 角色 | 手机版 |
|---|---|
| 页面标题（Hi Charlotte 👋） | Noto 600 · 30 |
| 卡片大字（牛奶 先喝掉） | Noto 600 · 27 |
| 大数字（$214.50） | Noto 600 · 40，小数部分 22 |
| 卡片标签（今日待办） | Noto 500 · 13，文字/次 |
| 正文 | Noto 400 · 14 |

手机版小字落在浅色卡片上，要满足 4.5:1 对比度，所以三个小字颜色各加深一档：棕 `#7f4f3c`、警示 `#8e4a35`、次文字 `#5b645c`（网页版的大字号不受影响）。

### Named Rules
**The 中文不用 Gaegu Rule.** Gaegu 没有中文字形，中文大字一律 ZCOOL KuaiLe。

**The 小字不手写 Rule.** 小字一律 Noto Sans SC，不用手写体，也不用浅灰斜体衬线。

## Layout

- **桌面画板：** 1440 宽，高度随内容（1180–2362），最后一个版块下面留 64。
- **侧栏：** x 0–210，没有底色，直接放在纸张背景上。所有桌面页的侧栏相同。
- **内容区：** x 226 起，宽 1174，右边距 40。半宽卡片是 575 + 24 + 575。
- **大分组底板：** 和其他版块同宽（x 226，宽 1174），圆角 22，白底，内边距 16，里面放浅底小卡片（两列间距 24，三列间距 20）。
- **竖向节奏：** 顶栏 y 24；banner y 116、高 254；banner 下空 32，第一排内容 y 402；版块之间一律 24；页面底部 64。卡片高度包住内容。所有版块左右边缘都对齐在 226 和 1400。
- **每页固定结构：** 顶栏（左视图切换药丸，右搜索框）→ Banner（眉标、大标题、一行事实摘要、1 个主按钮 + 1–2 个次按钮、右上角插画）→ 内容版块。
- **手机画板：** 390 宽，圆角 56，顶部灵动岛 118×34。手机只做「记和查」，底部常驻「我想记…」。

## Elevation & Depth

柔和的分层：卡片靠白色和淡薄荷背景的明度差浮起来，阴影很淡，只是让边缘不生硬。贴纸插画的阴影稍重，让它像贴在纸上。

### Shadow Vocabulary
- **版块卡片**（`box-shadow: 0 4px 16px rgba(60,85,70,.05)`）：最常用。
- **小卡片 / 按钮**（`box-shadow: 0 1.5px 4.5px rgba(52,72,59,.05), 0 4.5px 13.5px rgba(52,72,59,.10)`）。
- **悬浮按钮「记一笔」**（第二层加深为 `0 6px 14px rgba(52,72,59,.18)`）。
- **贴纸插画**（`0 3px 6px rgba(46,42,39,.14)`）。
- **纸张纹理**：Noise，双色，size 1，density 0.5，颜色 `rgba(77,102,84,.14)` + `rgba(255,255,255,.38)`。

## Shapes

大圆角、胶囊形为主，只有首页 banner 接近直角，像一张纸。

| 元素 | 圆角 |
|---|---|
| 版块卡片、分组底板 | 22 |
| 分组内小卡片 | 16–20 |
| 首页 banner | 4 |
| 顶栏 tab 药丸 | 29–34 |
| 搜索框 | 21–26 |
| 按钮、chip | 全圆 |
| 勾选框 | 全圆 |
| 手机外壳 / 手机内卡片 | 56 / 20–22 |

## Components

### Buttons
- **Shape:** 胶囊形（999）。
- **Primary:** 深绿底 #3e5b4b、白字，Noto Medium 16。每个 banner 最多一个。
- **Secondary:** 白底、深色字，双层阴影。

### Chips
- **Style:** 胶囊形，浅色标签底，Noto Medium 16–17。
- **用法:** 一张卡上常放两个：来源 chip（有底色，如小红书、课堂、网页）+ 分类 chip（无底，只有文字）。

### Cards / Containers
- **版块卡片:** 白底，圆角 22，版块卡片阴影。
- **分组底板:** 白底包住多张浅底小卡片（#f8fbf9 或标签色）。
- **便签卡（随手记）:** 3 列瀑布流，宽 372，间距 18；底色按类型（备忘淡蓝，灵感粉 / 绿 / 黄，清单和链接白）。

### Inputs / Fields
- **搜索框:** 白底胶囊 270×52，前缀「⌕」，占位文字写具体问题（「东西放哪了…」「冰箱里有…」「我想记…」）。
- **快速记录卡:** 标题「现在想记点什么？」，输入方式（文字 / 清单 / 链接 / + 标签），深绿按钮「存一下 →」。

### Navigation
- **侧栏:** 品牌 `my little os.`；分组 OVERVIEW（首页、随手记、每周复盘）/ DEPARTMENTS / PRIVATE（个人档案 🔒）；底部「📱 手机版 →」。
- **Typography:** Noto Sans SC 16。当前页文字/主加粗，其他文字/次；数量用文字/棕右对齐。
- **视图切换药丸:** 白底，圆角约 30，高 68，2–4 个 tab；选中文字/主，未选中 #737e74，数量用棕色上标。

### 勾选框
- 14–30 的圆框，统一圆形，空框描边 #a9b4a4。
- 勾选后深绿底、白色 ✓，文字变文字/次并加删除线。

### 进度条
- 高 6，圆角 3，底色浅标签色，已完成 #8fa98a，右侧写 `3 / 7` 或百分比。

### 日期块
- 浅黄底，圆角 10，宽 60；上面 Gaegu Bold 20 写日期（11.21），下面 Noto 10 写星期。

### 状态胶囊
- 浅绿或浅灰底，小字：进行中、未开始、等结果、11.10 投递。剩余时间按颜色区分：快到期红、几天内黄、充裕绿。

### 插画贴纸（Signature）
- 图片图层，叠在卡片边缘或角落，可以超出卡片，带贴纸阴影。每页最多 1–2 张。
- 题材：花、猫、荷叶、瓷器、灯笼、食物、文具、蝴蝶。实现时导出到仓库的 `assets/`。

## Do's and Don'ts

### Do:
- **Do** 用淡薄荷纸（#ebf2ed + Noise）做页面背景，用白卡片做版块。
- **Do** 中文大字用 ZCOOL KuaiLe，英文大字和数字用 Gaegu Bold，小字用 Noto Sans SC。
- **Do** 只写事实：日期、数量、截止时间、金额。
- **Do** 把深绿 #3e5b4b 留给主按钮、勾选、大数字和当前选中。
- **Do** 每个 banner 都有：眉标、大标题、一行事实摘要、1 个主按钮。
- **Do** 让每个版块的左右边缘对齐在 x 226 和 1400，版块之间 24。
- **Do** 改设计先改 Figma，再同步 spec 和这里。

### 字号档位（2026-11-20 typeset）
网页版：页面大标题 ZCOOL 60 · 版块标题 ZCOOL 30（首页 26）· 卡片标题 ZCOOL 26 · 小方块标题 ZCOOL 20 · 引言 ZCOOL 24（最宽 32em）· 大数字 Gaegu 88 / 56 / 40 / 28 · 行内主文字 Noto 18/500 · 正文 Noto 16 · 说明 Noto 14 · 最小字 12（不再出现 12px 以下）· 金额 DM Mono 17。数字一律等宽（tabular-nums），标题 text-wrap: balance，段落 pretty。
手机版：页面标题 28 · 卡片大字 24 · 版块标题 20 · 条目 15/600 · 正文 14 · 标签 13/500 · 说明 12 · 角标 11。

### tab（2026-11-20，用户定）
顶部 tab 只写名字，不加数量角标。

### 小字规则（2026-11-20，用户定）
用法要靠大标题和设计本身让人看懂（筛选做成可选中的 chip、动作做成按钮、横条直接标分类），不靠小字提示。必须写小字时，只写新的事实，不写下面四类：
- **复述标题**：标题或 banner 已经说过的，不再说一遍（例：「错词本 · 最近答错」）。
- **免责声明**：不在每张卡上挂「示例」「过期自动隐藏」「不同步」之类的说明。
- **按钮提示**：不写「点击下方按钮即可」「点上面的分类可以筛选」「（可以不填）」。
- **模块说明**：不在每个数字下面加一句解释；要说明的放进进度条、刻度或标签本身。
也不写口号、鸡汤，不用中英文重复同一个词（首页的 Today / Week / Month 和统计英文标签除外，用户选择保留）。

### Don't:
- **Don't** 用黑色背景，也不要满屏黄色或米色背景。
- **Don't** 写口号或问候（「今天也要加油」「Good morning」）。首页「Hi Charlotte 👋」是唯一例外。
- **Don't** 出现韩文。
- **Don't** 小字用手写体，或用比 #677168 更浅的灰。
- **Don't** 在首页 banner 和教务处课程卡以外使用衬线体。
- **Don't** 用饱和的分类色做大面积色块。
- **Don't** 一页放超过 2 张插画贴纸。
- **Don't** 在卡片底部留大块空白，或让分组底板比其他版块更宽。
- **Don't** 拿 `存档/os/` 的旧 HTML 稿当视觉依据，它已经过时；以 `demo/v4/` 为准。
