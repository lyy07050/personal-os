# 人生 OS 搭建计划（2026-11-20 版）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> 本版替换 2026-11-10 版。执行方式（用户 2026-11-20 选定）：在主对话里一步步做（superpowers:executing-plans），每一步用户都看得到。

**Goal:** 在 `personal assistance/LifeOS/` 搭好一个可以直接用 Obsidian（Mac + iPhone）打开的人生 OS 仓库：文件夹、数据格式、模板、示例数据、电脑端 10 个面板（含分页面）、手机端页面、加密的个人档案，配上 Quercus 同步脚本、快捷指令教程和说明书。

**Architecture:** 数据全部是 markdown（行内字段或 frontmatter），格式由 `tools/lifeos_formats.py` 统一定义和校验。每个面板笔记只有一个 `dv.view("90 系统/views/<名字>", 参数)`，view.js 从仓库读数据渲染；样式集中在一个 CSS 片段里，数值照 HTML 稿 `demo/v4/`。Quercus 同步是只用标准库的 Python 脚本，只改写标记包起来的那一段。

**Tech Stack:** Obsidian 1.9+，社区插件 Dataview、Tasks、Templater、Homepage、Spaced Repetition、Meld Encrypt；Python 3.14 标准库，测试用 pytest；Node 26（只用来 `node --check` view.js）；iOS 快捷指令。

**Spec:**
- 主文档：`personal assistance/docs/2026-11-19-ui-design-spec.md`（第 0 节产品逻辑，6.x 每页内容，7.6 分页面表，7.7 手机版分页面）
- `personal assistance/PRODUCT.md`（产品与安全规则）、`personal assistance/DESIGN.md`（颜色、字号档位、小字规则）
- **视觉依据：HTML 稿 `personal assistance/demo/v4/`**（入口 `index.html`；网页版 `desktop-*.html`，手机版 `mobile-*.html`，共用 `desktop.css`、`mobile.css`、`desktop.js`、`mobile.js`、`food.js`）。Figma 已经落后于 HTML 稿，以 HTML 稿为准。

## Global Constraints

- 仓库根目录：`/Users/charlotteli/Documents/workspace/personal assistance/LifeOS/`；工具和测试放在 `personal assistance/tools/`、`personal assistance/tests/`（仓库外面）
- 顶层文件夹名（照抄）：`00 随手记`、`10 总部`、`20 财务部`、`30 后勤部`、`40 研发部`、`45 教务处`、`50 人事部`、`60 个人档案`、`90 系统`
- `60 个人档案`：**不上传任何云端**（不进 Obsidian Sync、不进 iCloud、不进 git）；Claude Code 禁止读取；手机上存一份**加密副本**，只能用 AirDrop / 数据线放进手机仓库，打开要输密码，账号密码那篇要第二个密码（Meld Encrypt 单独加密）；仓库里不放任何示例个人数据
- `45 教务处/课件/`：不进 Sync、不进 git
- 记账格式：`- 2026-11-18 奶茶 [金额:: 6.50] [分类:: 餐饮] [方式:: ApplePay]`；货币 CAD，显示 `$`；分类（顺序固定）：餐饮、交通、购物、服饰、日用、美妆、娱乐、学习、居住、其他；认不出写 `待分类`
- 食物格式：`- [ ] 牛奶 [数量:: 1 L] [到期:: 2026-11-19] [位置:: 冷藏]`；位置只有 冷藏 / 冷冻 / 常温
- 截止格式：`- [ ] DATA 101 作业 4 [截止:: 2026-11-18 23:59] [课程:: DATA 101]`
- 随手记卡片：一张卡一篇笔记，放 `00 随手记/`，frontmatter `type`（活动 / 备忘 / 灵感 / 链接 / 清单）、`pinned: bool`、`source`（小红书 / 邮件 / 网页 / 抖音…）、活动另有 `date: YYYY-MM-DD`；清单内容用任务列表
- 物品：一件一篇，放 `30 后勤部/物品/`，frontmatter `category`（电子 / 小玩意 / 衣物 / 化妆品 / 厨房）、`location`、`bought`、`price`、`warranty`（可空）
- 知识卡：一张一篇，放 `40 研发部/知识卡/`，frontmatter `category`（生活小知识 / 体态 / 变美 / 多伦多生活 / 回国吃喝玩乐 / 学习 / 求职，一张只放一个）、`source`
- 英语卡片：`front::back` 单行，文件带 `#flashcards` 标签
- 示例数据带 `示例` 标签（frontmatter `tags: [示例]` 或行尾 `#示例`），但**界面上不显示「示例」二字**
- 示例日期以 `2026-11-18`（周三）为「今天」，和 HTML 稿一致
- 界面文字规则（DESIGN.md「小字规则」）：用法靠大标题和设计表达；不写复述标题的小字、不在每张卡挂免责声明、不写按钮提示、不在每个数字下面加解释、不写口号；顶部 tab 只写名字，不加数字
- 字号档位（DESIGN.md「字号档位」）：网页版页面标题 ZCOOL 60 / 版块 30（首页 26）/ 卡片 26 / 小方块 20，大数字 Gaegu 88·56·40·28，正文 Noto 16，说明 14，最小 12；手机版 Noto 600 标题 28 / 卡片大字 24 / 版块 20，正文 14，最小 11
- 首页只读：首页和复盘只汇总各部门数据，不单独录入
- Quercus：`https://q.utoronto.ca/api/v1`，只读；令牌只存在钥匙串（service `lifeos-quercus`），任何文件、命令行、聊天里都不出现令牌；课件超过 200 MB 跳过；不同步公告和成绩
- 时区：America/Toronto
- 不调用任何外部 AI API；手机端不用 AI；view.js 和 CSS 不从外网加载任何东西（字体也放在本地）

## Review Focus

1. **记账行写错**（漏金额、全角冒号 `：：`、金额带 `$`）：校验脚本要指出第几行 → Task 2 测 `lint_vault`
2. **随手记活动没写日期，或日期已过**：首页「最近的活动」不显示它，也不报错；未来的按日期升序 → Task 5 测 `upcoming_events`
3. **食物没有对应的贴纸**（比如「豆腐」）：显示浅色圆底 emoji，不出现破图 → Task 4 测 `food_icon`
4. **用户在 `截止日期.md` 或课程主页里手写了内容**：再次同步不能覆盖标记以外的部分 → Task 8 测 `replace_managed_block`
5. **令牌没存或已过期（401）**：中文提示怎么做，不打印令牌、不抛原始异常 → Task 8 测 `QuercusAuthError`

---

### Task 1: 仓库骨架、git 和安全设置

**Files:**
- Modify: `workspace/.claude/settings.json`（**合并**进 deny 规则，不覆盖原有内容；改之前先读）
- Create: `personal assistance/.gitignore`、`personal assistance/.claude/settings.json`、`personal assistance/CLAUDE.md`、`LifeOS/` 下的文件夹树（空文件夹放 `.gitkeep`）
- Test: `tests/test_structure.py`

**Interfaces:**
- Produces: 文件夹树（9 个顶层文件夹；`10 总部/复盘/`、`10 总部/手机/`、`10 总部/日记/`、`10 总部/项目/`、`30 后勤部/物品/`、`40 研发部/知识卡/`、`40 研发部/灵感/`、`40 研发部/胡思乱想/`、`40 研发部/英语/`、`45 教务处/课程/`、`45 教务处/课件/`、`90 系统/views/`、`90 系统/模板/`、`90 系统/附件/插画/`、`90 系统/附件/food/`）；`CLAUDE.md` 写明 AI 秘书指令

- [ ] **Step 1:** 在 `personal assistance/` 执行 `git init`；建 `tools/.venv` 并 `pip install pytest`
- [ ] **Step 2: 写失败的测试** `tests/test_structure.py`
  - `test_top_level_folders`：9 个顶层文件夹都存在，名字和 Global Constraints 完全一致（含 `00 随手记`，不含 `00 收件箱`）
  - `test_private_folders_gitignored`：`git check-ignore -q "LifeOS/60 个人档案/x.md"` 和 `"LifeOS/45 教务处/课件/a.pdf"` 返回码都是 0
  - `test_claude_denies_private`：`personal assistance/.claude/settings.json` 的 `permissions.deny` 里有 `Read(./LifeOS/60 个人档案/**)`；`workspace/.claude/settings.json` 的 deny 里有绝对路径 `Read(//Users/charlotteli/Documents/workspace/personal assistance/LifeOS/60 个人档案/**)`
  - `test_claude_md_lists_commands`：`CLAUDE.md` 包含「整理账本」「整理随手记」「整理英文」「整理课堂笔记」「生成本周复盘」「同步 Quercus」，且包含「绝不读取 60 个人档案」
- [ ] **Step 3:** 运行 `tools/.venv/bin/pytest tests/test_structure.py -v`，预期 FAIL
- [ ] **Step 4:** 建文件夹树、`.gitignore`（另忽略 `tools/.venv/`、`LifeOS/.obsidian/workspace*.json`、`LifeOS/.obsidian/cache`）、两个 `settings.json`、`CLAUDE.md`（每条指令写清读哪些文件、写到哪里、用 Global Constraints 里的哪种格式；「整理随手记」= 把有去处的卡片挪到对应部门，没去处的留下）
- [ ] **Step 5:** 运行测试，预期 PASS
- [ ] **Step 6:** `git add -A && git commit -m "feat: LifeOS skeleton and security settings"`

### Task 2: 数据格式库、校验脚本和示例数据

**Files:**
- Create: `tools/lifeos_formats.py`、`tools/lint_vault.py`、`tools/make_samples.py`
- Create（由 make_samples 生成，内容照 HTML 稿）：`20 财务部/账本/2026-11.md`、`2026-10.md`、`20 财务部/分类规则.md`、`20 财务部/订阅.md`、`30 后勤部/食物.md`（冷藏 6 / 冷冻 3 / 常温 6）、`30 后勤部/购物清单.md`、`30 后勤部/食谱/*.md`（3 道）、`30 后勤部/物品/*.md`（9 件，五个分类都有）、`40 研发部/知识卡/*.md`（6 张）、`40 研发部/灵感/*.md`、`40 研发部/胡思乱想/2026-11-*.md`、`40 研发部/英语/{单词本,错词本}.md`、`45 教务处/截止日期.md`、`45 教务处/课程/<4 门课>/课程主页.md`、`10 总部/日记/`（最近 112 天）、`10 总部/项目/*.md`（5 件事情，带 `progress: 0-100`）、`00 随手记/*.md`（11 张卡：活动 3、备忘 2、灵感 3、链接 1、清单 2）、`50 人事部/投递/*.md`（14 条，`stage`: 想投 / 已投递 / 面试中 / Offer）
- Test: `tests/test_formats.py`、`tests/test_lint.py`

**Interfaces:**
- Produces:
  - `parse_ledger_line(line: str) -> LedgerEntry | None`；`LedgerEntry(date: date, name: str, amount: Decimal, category: str, method: str)`
  - `parse_food_line(line: str) -> FoodItem | None`；`FoodItem(done: bool, name: str, qty: str, expires: date | None, place: str)`
  - `parse_deadline_line(line: str) -> Deadline | None`；`Deadline(done: bool, title: str, due: datetime | None, course: str)`；`format_deadline(d: Deadline) -> str` 是逆操作
  - `CATEGORIES: tuple[str, ...]`（10 个 + `待分类`）、`ITEM_CATEGORIES = ("电子","小玩意","衣物","化妆品","厨房")`、`NOTE_CATEGORIES = ("生活小知识","体态","变美","多伦多生活","回国吃喝玩乐","学习","求职")`、`INBOX_TYPES = ("活动","备忘","灵感","链接","清单")`、`STAGES = ("想投","已投递","面试中","Offer")`
  - `lint_vault(root: Path) -> list[LintError]`；`LintError(path: Path, line: int, message: str)`；命令行 `python3 tools/lint_vault.py LifeOS` 有错误返回 1
- 日记 frontmatter：`date`、`早起`、`喝水`、`运动`、`背词`、`早睡`（bool，和复盘习惯打卡同名）、`tags`

- [ ] **Step 1: 写失败的测试** `tests/test_formats.py`
  - `test_parse_ledger_basic`：`- 2026-11-18 奶茶 [金额:: 6.50] [分类:: 餐饮] [方式:: ApplePay]` → `amount == Decimal("6.50")`、`category == "餐饮"`
  - `test_parse_ledger_rejects_missing_amount`：`- 2026-11-18 奶茶 [分类:: 餐饮]` → `None`
  - `test_parse_ledger_dollar_sign`：`[金额:: $18.50]` → `Decimal("18.50")`
  - `test_parse_food`：`- [ ] 牛奶 [数量:: 1 L] [到期:: 2026-11-19] [位置:: 冷藏]` → `expires == date(2026,11,19)`、`place == "冷藏"`
  - `test_deadline_roundtrip`：`format_deadline(parse_deadline_line(s)) == s`；`[截止:: 无]` → `due is None`
- [ ] **Step 2: 写失败的测试** `tests/test_lint.py`（`tmp_path` 里建小仓库）
  - `test_lint_flags_bad_ledger_line`：第 3 行 `[金额：： 18]` → 一个错误，`line == 3`，message 含「金额」
  - `test_lint_flags_unknown_category`：`[分类:: 零食]` → message 含「分类」
  - `test_lint_flags_bad_item_category`：物品 `category: 书` → message 含「category」
  - `test_lint_flags_inbox_type`：随手记卡 `type: 待办` → message 含「type」
  - `test_lint_skips_private_folder`：`60 个人档案/` 里放坏文件 → 不报错（也不打开它）
  - `test_lint_clean_samples`：`make_samples.main(tmp_path)` 后 `lint_vault(tmp_path) == []`
- [ ] **Step 3:** 运行 `pytest tests/test_formats.py tests/test_lint.py -v`，预期 FAIL
- [ ] **Step 4:** 实现 `lifeos_formats.py` 和 `lint_vault.py`（`os.walk` 碰到 `60 个人档案` 和 `课件` 直接跳过，不进入）
- [ ] **Step 5:** 实现 `make_samples.py`：`main(root: Path, today: date = date(2026, 11, 18))`，`random.Random(7)` 保证可重复；数字和 HTML 稿一致（本周花费 $214.50、本月 $812.40 / 预算 $1,400、冷藏 6 样、知识卡 38 张里放 6 张实例、连续 23 天）；**不往 `60 个人档案` 写任何内容**
- [ ] **Step 6:** 运行测试，预期 PASS；再运行 `python3 tools/make_samples.py LifeOS && python3 tools/lint_vault.py LifeOS`，无输出、返回 0
- [ ] **Step 7:** commit `feat: data formats, linter and sample data`

### Task 3: 模板

**Files:**
- Create: `LifeOS/90 系统/模板/{日记,周复盘,事情,物品,随手记卡片,课程主页,课堂笔记,胡思乱想,知识卡}.md`
- Test: `tests/test_templates.py`

**Interfaces:**
- Consumes: Task 2 的 frontmatter 字段和格式
- Produces: Templater 模板（`<% tp.date.now("YYYY-MM-DD") %>`）；周复盘模板生成 `10 总部/复盘/<GGGG-[W]WW>.md`，第一节「## 下周三件要事」是 3 行任务 `- [ ] … [来源:: 复盘]`，下面一行 `dv.view("90 系统/views/review")`

- [ ] **Step 1: 写失败的测试**：`test_daily_template_has_habit_fields`（frontmatter 有 5 个习惯字段）；`test_review_template_three_goals`（「## 下周三件要事」下面正好 3 行带 `[来源:: 复盘]` 的任务）；`test_inbox_card_template_type`（`type` 默认 `备忘`、`pinned: false`）；`test_templates_render_samples_lint_clean`（把 `<% … %>` 换成固定日期后放进临时仓库跑 lint，无错误）
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 写模板
- [ ] **Step 4:** 运行，预期 PASS
- [ ] **Step 5:** commit `feat: templates`

### Task 4: 样式、字体和插画素材

**Files:**
- Create: `LifeOS/.obsidian/snippets/lifeos.css`（token、组件、网页版、手机版 `.is-mobile`、手账效果）、`LifeOS/.obsidian/snippets/lifeos-fonts.css`
- Create: `LifeOS/90 系统/附件/插画/*`（从 `demo/v4/assets/` 拷贝 banner 插画）、`LifeOS/90 系统/附件/food/*.png`（从 `demo/v4/assets/food/` 拷贝 75 个）、`LifeOS/90 系统/views/_shared/food.js`
- Create: `tools/build_fonts_css.py`
- Test: `tests/test_assets.py`

**Interfaces:**
- Produces:
  - CSS 变量和类名照 `demo/v4/desktop.css` / `mobile.css`（`--paper`、`--green`、`--ink`…；`.card`、`.chip`、`.ck`、`.tape`、`.stamp`），面板根节点 class `lifeos-dash`
  - `food.js` 导出 `foodIcon(name: string, size: number) -> string`（HTML）：有 `90 系统/附件/food/<name>.png` 用贴纸，否则用浅色圆底 emoji（映射照 `demo/v4/food.js` 的 `FOOD_EMOJI` / `FOOD_ALIAS`）；其他 view 用 `const {foodIcon} = await dv.view` 之外的方式加载：`eval(await dv.io.load("90 系统/views/_shared/food.js"))`
  - `build_fonts_css.py`：把 `tools/fonts/` 里的 woff2（ZCOOL KuaiLe、Gaegu 700、DM Mono、Playfair Display 700、Crimson Text 600）base64 写进 `lifeos-fonts.css`；中文正文用系统的 PingFang SC 代替 Noto Sans SC（Noto 中文字体太大，不内嵌）
- [ ] **Step 1: 写失败的测试**：`test_food_stickers_copied`（`附件/food/` 有 75 个 png，文件名和 `demo/v4/assets/food/` 一致）；`test_css_has_tokens`（`lifeos.css` 里有 `--green:#3e5b4b`、`--paper:#ebf2ed`、`.is-mobile`）；`test_css_no_external_urls`（两个 CSS 里不出现 `http`）；`test_food_icon_fallback`（用 node 跑 `food.js`，`foodIcon("豆腐",40)` 含 `food-emoji`、不含 `<img`；`foodIcon("牛奶",40)` 含 `牛奶.png`）
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现（字体文件由用户从 Google Fonts 下载放进 `tools/fonts/`，计划里不联网下载）
- [ ] **Step 4:** 运行，预期 PASS
- [ ] **Step 5:** commit `feat: styles, fonts and illustrations`

### Task 5: 电脑端面板和分页面

**Files:**
- Create views：`LifeOS/90 系统/views/{home,inbox,review,finance,fridge,things,notes,english,school,career,tabs,weekcal,heatmap}/view.js`
- Create 面板笔记（主页面）：`10 总部/首页.md`、`00 随手记/随手记.md`、`10 总部/周复盘面板.md`、`20 财务部/财务面板.md`、`30 后勤部/食物墙.md`、`30 后勤部/物品墙.md`、`40 研发部/知识库.md`、`40 研发部/英语/英语面板.md`、`45 教务处/教务面板.md`、`50 人事部/求职.md`
- Create 分页面（UI 规范 7.6）：`20 财务部/财务面板/{本周,2026 年}.md`、`30 后勤部/物品墙/{电子,小玩意,衣物,化妆品,厨房}.md`、`40 研发部/知识库/{灵感,胡思乱想}.md`、`40 研发部/英语/{单词本,错词本}.md`、`45 教务处/{截止日期,课件,笔记}.md`、`50 人事部/求职/{面试,求职笔记}.md`；首页、食物墙、随手记、个人档案没有分页面
- Test: `tests/test_views.py`

**Interfaces:**
- Consumes: Task 2 的数据位置和字段；Task 4 的 CSS 类和 `foodIcon`
- Produces:
  - 每个面板笔记 frontmatter `cssclasses: [lifeos-dash]`，正文只有一个 dataviewjs 块 `await dv.view("90 系统/views/<名字>", {…})`；分页面复用主页面的 view，用参数切换，例如 `dv.view("90 系统/views/things", {category: "电子"})`
  - `tabs` view：参数 `{current: string, pages: [{label: string, path: string}]}`，当前页高亮，其余是链接，**不显示数字**
  - `home/view.js` 里的纯函数（挂在 `window.lifeos` 上便于测试）：`upcomingEvents(cards, today) -> cards`（`type == "活动"`、`date >= today`，按日期升序，最多 3 条）、`reminders(cards) -> cards`（`pinned == true` 且还有没勾的任务）
- [ ] **Step 1: 写失败的测试** `tests/test_views.py`
  - `test_every_dashboard_calls_existing_view`：所有 `lifeos-dash` 笔记里 `dv.view("…")` 指向的目录下都有 `view.js`
  - `test_view_js_syntax`：每个 view.js 包进 `(async()=>{ … })` 后 `node --check` 返回 0
  - `test_every_subpage_has_tabs`：7.6 表里的每个分页面都调用 `90 系统/views/tabs`，tab 里的每个 path 都指向存在的笔记，tab 文字里没有数字
  - `test_upcoming_events`：输入 4 张卡（11.21、11.29、过期的 11.10、没写 date 的活动）+ 今天 2026-11-18 → 只返回 11.21、11.29
  - `test_no_banned_copy_in_views`：view.js 里不出现「示例」「过期自动隐藏」「点上面的」「可以不填」「继续投」
  - `test_no_external_urls_in_views`：view.js 里不出现 `http`
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 写 view.js，布局、文案、数字照 `demo/v4/desktop-*.html`：首页（问候 + 今日待办 + 本周日程 + 今日概览 + Fridge + 事情进度 + 最近的活动 + Reminder）；每周复盘（下周三件要事在最上面，点「放进首页待办」把三行任务加进本周复盘笔记，首页今日待办会读到）；财务（本月进度条 + 分类 6 类 + 每周花费 + 账单流水 + 待分类「分类 ✓ / 改」+ 订阅）；食物墙（六类方块 + 「吃完」把这行打勾并把名字加进购物清单 + 购物清单 + 今天可以做）；物品墙（位置用大字）；知识库（分类方块点了筛选）；其余按对应 HTML
- [ ] **Step 4:** 运行，预期 PASS
- [ ] **Step 5:** commit `feat: desktop dashboards and subpages`

### Task 6: 手机端页面

**Files:**
- Create: `LifeOS/10 总部/手机/{手机首页,冰箱,所有部门,随手记,每周复盘,物品墙,知识库,多邻国,教务处,人事部}.md`、`LifeOS/90 系统/views/m-{home,fridge,more,inbox,review,things,notes,english,school,career}/view.js`
- Modify: `lifeos.css`（`.is-mobile .lifeos-dash` 下的手机样式，照 `demo/v4/mobile.css` 和 `mobile-*.html`）
- Test: 在 `tests/test_views.py` 里加用例

**Interfaces:**
- Consumes: Task 5 的数据函数（`upcomingEvents`、`reminders`）和 Task 4 的 `foodIcon`
- Produces: 手机首页顶部问候卡（桃花枝 + 猫和盆栽插画，「Hi Charlotte 👋」+ 大日期）；右上圆按钮进「所有部门」；底部「我想记…」输入框写进 `00 随手记/` 一张新的备忘卡；「+」菜单两项：记一笔（打开 iOS 快捷指令 `shortcuts://run-shortcut?name=记一笔`）、放进冰箱（打开「冰箱」页）；「所有部门」每个方块链到对应手机页面，最下面「个人档案」链到 `60 个人档案/个人档案`（Meld Encrypt 会要求输入密码）
- [ ] **Step 1: 写失败的测试**：`test_mobile_pages_exist`（10 个手机笔记都在、都调用存在的 m- view）；`test_more_page_links_exist`（`所有部门` view 里每个链接都指向存在的笔记，含 `60 个人档案/个人档案`）；`test_mobile_fridge_single_page`（m-fridge 里没有 tab，依次出现「冷藏」「冷冻」「常温」「购物清单」）
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现；Homepage 插件设置：电脑打开 `10 总部/首页`，手机打开 `10 总部/手机/手机首页`
- [ ] **Step 4:** 运行全部测试，预期 PASS
- [ ] **Step 5:** commit `feat: mobile pages`

### Task 7: 个人档案（加密，电脑和手机各一份）

**Files:**
- Create: `LifeOS/60 个人档案/` 下三个**空模板**：`个人档案.md`（身体数据、尺码两节，只有标题）、`账号密码.md`（只有标题）；`90 系统/views/profile/view.js`（读当前打开的已解密内容渲染成两张表）
- Create: `LifeOS/90 系统/个人档案使用说明.md`
- Test: `tests/test_private.py`

**Interfaces:**
- Consumes: Task 1 的 gitignore 和 deny 规则
- Produces: 加密流程写进说明：电脑上用 Meld Encrypt 把 `个人档案.md` 整篇加密（密码 A），`账号密码.md` 再用密码 B 单独加密；更新后用 AirDrop / 数据线把两个加密文件放进 iPhone 上仓库的 `60 个人档案/`；Obsidian Sync 的排除列表里有 `60 个人档案`；iCloud 不碰这个仓库
- [ ] **Step 1: 写失败的测试**：`test_private_templates_have_no_data`（两个模板除标题外没有内容，没有数字）；`test_private_not_synced_doc`（使用说明里同时出现「AirDrop」「不上传」「Sync 排除」）；`test_profile_view_never_reads_other_folders`（profile view.js 里不出现 `dv.pages(` 以外部文件夹为参数的调用）
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现。**Claude Code 只创建空模板，之后不读不写这个文件夹**；加密由用户自己操作
- [ ] **Step 4:** 运行，预期 PASS
- [ ] **Step 5:** commit `feat: private profile templates`

### Task 8: Quercus 同步脚本

**Files:**
- Create: `tools/quercus_sync.py`
- Test: `tests/test_quercus_sync.py`

**Interfaces:**
- Consumes: Task 2 的 `Deadline`、`format_deadline`
- Produces:
  - `get_token() -> str`：`security find-generic-password -s lifeos-quercus -w`；失败抛 `QuercusAuthError`
  - `class QuercusClient(base: str, token: str, http_get: Callable[[str, dict], tuple[Any, dict]] = urllib_get)`；`get_all(path: str, params: dict) -> list[dict]`（顺着 `Link: rel="next"` 翻页）；401 抛 `QuercusAuthError`
  - `safe_name(s: str) -> str`：`/ \ : * ? " < > |` 换成 `-`，去首尾空格和点，最长 80；空串变 `未命名`
  - `course_folder(course: dict) -> str`：`safe_name(f"{course_code} {name}")`
  - `render_deadlines(assignments: list[dict], tz: ZoneInfo) -> str`：每项一行 `format_deadline`；按截止升序，无截止排最后写 `[截止:: 无]`；`submission.workflow_state in {"submitted","graded"}` 写 `- [x]`
  - `replace_managed_block(text: str, body: str) -> str`：替换 `<!-- quercus:start -->` 和 `<!-- quercus:end -->` 之间；没有标记就加到末尾
  - `plan_downloads(files: list[dict], dest: Path, manifest: dict, max_bytes: int = 200*1024*1024) -> tuple[list[dict], list[dict]]`
  - `main(argv) -> int`：`--dry-run`；写 `45 教务处/截止日期.md`、每门课 `课程主页.md` 的标记段、`45 教务处/课件/<课程>/…`、`45 教务处/课件/.manifest.json`；出错打印中文提示并返回 1
- 接口：`/courses?enrollment_state=active&per_page=100`、`/courses/:id/assignments?include[]=submission&per_page=100`、`/courses/:id/folders`、`/courses/:id/files`；`/files` 返回 401/403 时改用 `/courses/:id/modules?include[]=items` 里 `type == "File"` 的项

- [ ] **Step 1: 写失败的测试**（假的 `http_get`，不连网）：`test_pagination_follows_link_header`（两页合起来 3 门课）；`test_401_raises_auth_error_without_token_in_message`（message 含「钥匙串」、不含 token）；`test_safe_name`（`"INF 1340: Programming / Intro?"` → `"INF 1340- Programming - Intro-"`；`"..."` → `"未命名"`）；`test_render_deadlines_sort_and_status`（昨天已交[x]、明天[ ]、无截止 的顺序；`2026-11-19T04:59:00Z` → `2026-11-18 23:59`）；`test_replace_managed_block_keeps_user_text`；`test_plan_downloads_skips_unchanged_and_large`（3 个文件 → 下载 1、跳过 2）；`test_files_fallback_to_modules`；`test_dry_run_writes_nothing`
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现（只用标准库；下载先写 `.part` 再改名）
- [ ] **Step 4:** 运行，预期 PASS
- [ ] **Step 5:** commit `feat: Quercus sync`
- [ ] **Step 6（和用户一起做）:** 用户按说明书生成令牌并自己存进钥匙串，然后运行 `python3 tools/quercus_sync.py --dry-run`，确认列出这学期的课程

### Task 9: 每天自动同步（launchd）

**Files:**
- Create: `tools/com.lifeos.quercus.plist`、`tools/install_daily_sync.sh`
- Test: `tests/test_plist.py`

- [ ] **Step 1: 写失败的测试**：`test_plist_valid`（`plutil -lint` 返回 0；`StartCalendarInterval` Hour 8、Minute 0；`ProgramArguments` 含 `quercus_sync.py` 的绝对路径；日志写 `~/Library/Logs/lifeos-quercus.log`）
- [ ] **Step 2:** 运行，预期 FAIL；**Step 3:** 实现；**Step 4:** 运行，预期 PASS
- [ ] **Step 5:** commit。安装脚本**不自动执行**，用户决定要不要开

### Task 10: 说明书、快捷指令教程和安全清单

**Files:**
- Create: `LifeOS/90 系统/说明书.md`、`LifeOS/90 系统/快捷指令教程.md`、`LifeOS/90 系统/安全清单.md`
- Test: `tests/test_docs.py`

**Interfaces:**
- Consumes: 所有格式（Task 2）、文件位置（Task 1）、插件清单（Tech Stack）、个人档案流程（Task 7）

- [ ] **Step 1: 写失败的测试**：`test_tutorial_covers_six_shortcuts`（有「存进知识库」「记一笔」「Apple Pay 自动记账」「我想记（快速记录）」「记英文」「放进冰箱」6 节）；`test_manual_mentions_sync_exclusions`（同时出现 `60 个人档案` 和 `课件` 两个排除项，以及「AirDrop」）；`test_no_secrets_in_docs`（没有连续 30 个以上字母数字的串）
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 写文档：
  - 说明书：安装 Obsidian（Mac + iPhone）→ 打开仓库 → 打开社区插件并逐个安装 → 放字体文件并运行 `build_fonts_css.py` → 打开两个 CSS 片段 → 设置 Homepage（电脑首页、手机手机首页）→ 订阅 Sync 并排除两个文件夹 → 个人档案加密和传到手机（见个人档案使用说明）→ 日常用法（记 → 整理 → 看 → 复盘）
  - 快捷指令教程：每个快捷指令用到哪些动作、按什么顺序；「记一笔」：用逗号或「还有」分隔多笔，每笔是「名称 + 数字」，用 `分类规则.md` 的关键词匹配分类；「我想记」写一张 `type: 备忘` 的随手记卡；「放进冰箱」问名称、数量、几天到期、位置，追加到 `食物.md`
  - 安全清单：FileVault、Sync 加密密码、`security add-generic-password -s lifeos-quercus -a quercus -w`（交互输入，不在命令行写令牌）、Meld Encrypt 两个密码、个人档案只走 AirDrop / 数据线
- [ ] **Step 4:** 运行，预期 PASS；**Step 5:** commit

### Task 11: 整体验收

- [ ] **Step 1:** 运行 `tools/.venv/bin/pytest -q && python3 tools/lint_vault.py LifeOS`，全部通过
- [ ] **Step 2（和用户一起做）:** 用户照说明书在 Mac 上打开仓库。对照 `demo/v4/index.html` 逐页检查网页版 10 个面板和分页面，记下差异再修
- [ ] **Step 3（和用户一起做）:** iPhone 上打开仓库，对照手机版 12 屏检查；搭好「记一笔」试记一笔，确认电脑账本出现这一行（Sync 已开）；把加密的个人档案用 AirDrop 放进手机，确认要输密码才能打开
- [ ] **Step 4:** commit `chore: acceptance fixes`
