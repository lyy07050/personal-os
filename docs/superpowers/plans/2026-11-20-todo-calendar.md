# 今日待办「＋」、待办卡片、可翻周日程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首页能直接加待办和日程：今日待办「＋」、随手记新类型「待办」、「我想记…」待办开关、今天的日程进待办、本周日程可翻周和「＋」加日程。

**Architecture:** 数据格式在 Python（`tools/lifeos_formats.py`、`lint_vault.py`、`make_samples.py`）和 JS（`_shared/lib.js` 纯函数 + `_shared/data.js` 读写）两边各一份、用测试对齐；界面改 `views/home`（电脑）、`_shared/m.js` 和 `views/m-home`（手机）。待办 = `00 随手记/` 里 `type: 待办` 的卡片；日程 = `10 总部/日程.md` 一行一条。

**Tech Stack:** Obsidian Dataview `dataviewjs`、原生 JS、Python 3 标准库、pytest、node（测纯函数）。

**Spec:** `docs/superpowers/specs/2026-11-20-todo-calendar-design.md`

## Global Constraints

- 用中文文案；view.js 里不出现「示例」「过期自动隐藏」「点上面的」「可以不填」「继续投」，不出现 `http`（`test_no_banned_copy_in_views`、`test_no_external_urls_in_views`）。
- 不读、不列、不让脚本进入 `LifeOS/60 个人档案/` 和 `LifeOS/45 教务处/课件/`。
- 改完数据文件运行 `python3 tools/lint_vault.py LifeOS`，无输出、返回 0。
- 待办卡 frontmatter：`type: 待办`、`done: true|false`、可选 `date: YYYY-MM-DD`、打勾时 `done_on: YYYY-MM-DD`、`created: YYYY-MM-DD`。
- 日程行：`- YYYY-MM-DD[ HH:MM] 事情[ [地点:: 地点]]`；Quercus 以后写在 `<!-- quercus:start -->` / `<!-- quercus:end -->` 之间，手写行只写在标记段外。
- 今日待办顺序：有时间的（按时间）→ 截止 → 待办卡 → 三件要事 → 项目；日程没有勾选框（小圆点），每周固定的课不进待办。
- 翻周状态只在内存里，重新打开回到本周；手机首页不做翻周。
- 测试：`tools/.venv/bin/pytest -q`；示例「今天」= 2026-11-18。
- 提交信息以 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` 结尾。

## Review Focus

1. 待办或日程文字里有 `/ : ? #` 等文件名不允许的字符，或和已有卡片同名 → 照样存下，文件名自动避开（Task 2 `test_safe_title`）。
2. 日程文字里有换行或 `[` → 存成一行，读回来文字不变（Task 1 `test_event_roundtrip_odd_text`、Task 2 `test_lib_event_matches_python`）。
3. 输入框空着或只有空格就回车 → 什么都不存，表单不关（Task 3、5 的手动检查步骤）。
4. 翻到跨月、跨年的周（2026-12-28 到 2027-01-03）→ 标题写对年月（Task 2 `test_week_label_cross_year`）。
5. `日程.md` 还不存在时 → 日历照常显示，第一次「＋」会新建这个文件（Task 2 `D.events()` 返回 `[]`，Task 4 手动检查）。

---

### Task 1: 格式、检查脚本、示例数据

**Files:**
- Modify: `tools/lifeos_formats.py`、`tools/lint_vault.py`、`tools/make_samples.py`
- Test: `tests/test_formats.py`、`tests/test_lint.py`

**Interfaces:**
- Produces:
  - `INBOX_TYPES = ("活动", "备忘", "灵感", "链接", "清单", "待办")`
  - `@dataclass Event(date: date, time: str | None, title: str, place: str)`；`parse_event_line(line: str) -> Event | None`；`format_event(e: Event) -> str`（`time` 为 `"HH:MM"` 或 `None`，`place` 空串时不写地点）
  - `EVENTS_PATH = "10 总部/日程.md"`
  - lint：`00 随手记/` 里 `type: 待办` 的卡：`done` 必须是 `true`/`false`，`date`、`done_on` 有就必须是日期；`日程.md` 里每个以 `- ` 开头的行必须能 `parse_event_line`，标记行、标题行、空行跳过
  - `make_samples`：3 张待办卡（`买洗衣液`：无 date、未完成；`交房租`：date 2026-11-18、未完成；`回邮件`：done true、done_on 2026-11-18）；`日程.md` 5 行：`2026-11-18 18:00 和 Mia 吃饭 [地点:: Kinton]`、`2026-11-20 牙医复查`、`2026-11-26 14:00 Coffee chat`、`2026-12-02 19:00 读书会`、`2026-12-03 交换礼物`

- [ ] **Step 1: 写失败的测试** `tests/test_formats.py`
  - `test_parse_event_timed`：`- 2026-11-29 15:00 和朋友吃饭 [地点:: Bahen]` → `date(2026,11,29)`、`time == "15:00"`、`title == "和朋友吃饭"`、`place == "Bahen"`
  - `test_parse_event_all_day`：`- 2026-11-29 和朋友吃饭` → `time is None`、`place == ""`
  - `test_parse_event_rejects`：`- 11-29 吃饭`、`- 2026-11-29 25:00 吃饭`、`- 2026-11-29` → `None`
  - `test_event_roundtrip_odd_text`：`format_event(Event(date(2026,11,29), None, "买 [礼物]\n给妈妈", ""))` 是单行且 `parse_event_line` 读回 `title == "买 [礼物] 给妈妈"`
- [ ] **Step 2: 写失败的测试** `tests/test_lint.py`
  - `test_lint_accepts_todo_card`：`type: 待办\ndone: false` → `[]`
  - `test_lint_flags_todo_done_value`：`done: 是` → 一个错误，message 含「done」
  - `test_lint_flags_bad_event_line`：`日程.md` 第 2 行 `- 2026-13-01 吃饭` → `line == 2`，message 含「日程」
  - `test_lint_skips_quercus_markers`：`日程.md` 含两行标记和 `# 日程` → `[]`
- [ ] **Step 3:** 运行 `tools/.venv/bin/pytest tests/test_formats.py tests/test_lint.py -q`，预期 FAIL
- [ ] **Step 4:** 实现。`format_event` 把 title 里的换行换成空格、`[` `]` 原样保留（读的时候地点只认最后的 `[地点:: …]`）
- [ ] **Step 5:** 运行全部测试，预期 PASS；再运行 `python3 tools/make_samples.py LifeOS && python3 tools/lint_vault.py LifeOS`，无输出
- [ ] **Step 6:** commit `feat: todo cards and events file formats`

### Task 2: lib.js 纯函数和 data.js 读写

**Files:**
- Modify: `LifeOS/90 系统/views/_shared/lib.js`、`LifeOS/90 系统/views/_shared/data.js`
- Test: `tests/test_views.py`

**Interfaces:**
- Consumes: Task 1 的行格式和 frontmatter 字段
- Produces（lib.js，挂在 `L` 上）：
  - `parseEvent(line) -> {date, time, title, place} | null`（`time` 为 `"HH:MM"` 或 `""`）；`formatEvent({date, time, title, place}) -> string`
  - `safeTitle(text) -> string`：去掉 `\ / : * ? " < > | # ^ [ ]`、换行变空格、最长 40，空串变 `随手记`（`newCard` 改用它）
  - `newCard(text, type = "备忘", meta = {})`：`type === "待办"` 时 frontmatter 写 `type`、`done: false`、`meta.date`（有才写）、`created`；其他类型照旧
  - `todoCards(cards, today) -> cards`：`type === "待办"` 且（`!done` 且（无 `date` 或 `date <= today`））或 `doneOn === today`
  - `weekLabel(monday) -> string`：同月 `2026年11月 · 16–22日`；跨月 `2026年11月30日–12月6日`；跨年 `2026年12月28日–2027年1月3日`
  - `cards()` 每张卡多两个字段：`done: p.done === true`、`doneOn: iso(p.done_on)`
- Produces（data.js，挂在 `D` 上）：
  - `EVENTS = "10 总部/日程.md"`
  - `events() -> [{date, time, title, place, line}]`（文件不在返回 `[]`）
  - `addEvent({date, time, title, place})`：文件不在就新建（第一行 `# 日程`）；插在标记段外、按 `date` + `time` 排好的位置
  - `todos()` 多两类：`kind: "card"`（`text`、`tag` = 卡的 `date` 或空、`done`、`path`）和 `kind: "ev"`（今天的日程行 + 今天的活动卡；`tag` = 时间或 `今天`；没有 `done`）；按 Global Constraints 的顺序排
  - `toggleTodo(t, done)`：`kind === "card"` 时 `done` 为真 → `setMeta(done, true)` + `setMeta(done_on, T)`；为假 → `setMeta(done, false)` + 删掉 `done_on`；`kind === "ev"` 什么都不做
  - `addTodo(text, date = "") -> path`：`L.newCard(text, "待办", date ? {date} : {})`

- [ ] **Step 1: 写失败的测试** `tests/test_views.py`（用现有 `_lib`）
  - `test_lib_event_matches_python`：同一组行（Task 1 的 4 种）JS `parseEvent` 和 Python `parse_event_line` 结果一致（`time` None ↔ `""`）；`formatEvent(parseEvent(s)) == s`
  - `test_safe_title`：`L.safeTitle("a/b:c?\n#d")` == `"a b c d"`（连续空格合成一个）；`L.safeTitle("   ")` == `"随手记"`；长度 ≤ 40
  - `test_todo_cards_filter`：输入 6 张卡（无 date 未完成、date 今天、date 明天、done 且 doneOn 今天、done 且 doneOn 昨天、type 备忘）+ 今天 2026-11-18 → 只留前两张和第四张
  - `test_week_label`：`"2026-11-16"` → `"2026年11月 · 16–22日"`；`"2026-11-30"` → `"2026年11月30日–12月6日"`
  - `test_week_label_cross_year`：`"2026-12-28"` → `"2026年12月28日–2027年1月3日"`
- [ ] **Step 2:** 运行 `tools/.venv/bin/pytest tests/test_views.py -q`，预期 FAIL
- [ ] **Step 3:** 实现 lib.js 的纯函数，再实现 data.js 的读写（`addEvent` 用 `L.fileOf` / `app.vault.create` / `app.vault.process`，`toggleTodo` 删字段用 `app.fileManager.processFrontMatter` 里 `delete fm.done_on`）
- [ ] **Step 4:** 运行全部测试，预期 PASS
- [ ] **Step 5:** commit `feat: todo card and event helpers`

### Task 3: 电脑首页 · 今日待办「＋」和「待办」开关

**Files:**
- Modify: `LifeOS/90 系统/views/home/view.js`
- Test: `tests/test_views.py`

**Interfaces:**
- Consumes: `D.todos()`、`D.toggleTodo(t, done)`、`D.addTodo(text)`、`L.newCard`

- [ ] **Step 1: 写失败的测试** `test_home_has_todo_add_and_capture_switch`：home/view.js 含 `aria-label="加一条待办"`、`D.addTodo(`、`aria-pressed`（开关）、`kind === "ev"`
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现
  - 今日待办标题行右边「＋」按钮（`aria-label="加一条待办"`）；点开在列表下面出现一个输入框（placeholder `加一条待办…`），回车保存后清空、留着继续加；Esc 或再点「＋」收起；空白不保存
  - 新加的一条立刻插进列表（不用等重新渲染），打勾照旧盖章
  - `kind === "ev"` 的行：用小圆点代替勾选框，不能点
  - 「我想记…」左边加开关按钮 `待办`（`aria-pressed` true/false，按下时用 `--sage` 底、`--green` 字）；按下时保存走 `D.addTodo`，提示「已存进今日待办」，否则照旧「已存进随手记」
- [ ] **Step 4:** 运行全部测试，预期 PASS
- [ ] **Step 5:** 预览检查：`python3 -m http.server 8766 --bind 127.0.0.1`，打开 `tools/preview/index.html?note=10 总部/首页&today=2026-11-18`，宽 1500：看到 `和 Mia 吃饭 18:00`（圆点）、`交房租`、`买洗衣液`、`回邮件`（划线）；点「＋」、输入、回车，页面日志里有新建 `00 随手记/…md` 且 frontmatter `type: 待办`；空格回车不写文件
- [ ] **Step 6:** commit `feat: add todos from the home page`

### Task 4: 电脑首页 · 日历翻周和「＋」加日程

**Files:**
- Modify: `LifeOS/90 系统/views/home/view.js`
- Test: `tests/test_views.py`

**Interfaces:**
- Consumes: `D.events()`、`D.addEvent(e)`、`L.weekLabel(monday)`、`L.addDays`、`L.mondayOf`

- [ ] **Step 1: 写失败的测试** `test_home_calendar_week_nav`：home/view.js 含 `aria-label="上一周"`、`aria-label="下一周"`、`回到本周`、`aria-label="加日程"`、`D.addEvent(`、`L.weekLabel(`
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现
  - `weekCal(offset)` 改成按任意一周画：截止、活动卡、日程行（全天进「全天」行，有时间的进格子；颜色用新类 `ev.y1`：`background:#fbf3dc;border-color:#c9a24a;color:#6f5420`）、面试、课（每周都画）、周日的「周复盘」只在本周画
  - 标题行：`本周日程`（不是本周时改成 `日程`）+ `‹` `weekLabel` `›` + 不是本周时显示「回到本周」+ 右边「＋」；翻周只重画日历这一块
  - 「＋」打开小表单（样式照 `.addf`）：日期（`type=date`，默认显示中那周里的今天，不在那周就周一）、时间（`type=time`，可空）、事情（必填）、地点（可空）；保存后表单收起、当前周重画、新日程出现在格子里；点格子里的日程打开 `10 总部/日程.md`
- [ ] **Step 4:** 运行全部测试，预期 PASS
- [ ] **Step 5:** 预览检查（同上，宽 1500）：本周看到 `和 Mia 吃饭`、`牙医复查`（全天）；点 `›` 看到 `Coffee chat` 14:00，再点看到 `读书会`、`交换礼物`，标题是 `2026年11月30日–12月6日`；「回到本周」回来；「＋」加一条，日志里 `10 总部/日程.md` 写入一行且位置按日期排好
- [ ] **Step 6:** commit `feat: week navigation and add events on the home calendar`

### Task 5: 手机 · 底部「待办」开关和手机首页「＋」

**Files:**
- Modify: `LifeOS/90 系统/views/_shared/m.js`、`LifeOS/90 系统/views/m-home/view.js`、`LifeOS/.obsidian/snippets/lifeos.css`（开关样式，手机和电脑共用一条）
- Test: `tests/test_views.py`

**Interfaces:**
- Consumes: `D.addTodo(text)`、`D.todos()`、`D.toggleTodo`；`M.mount` 需要 `D` → 改成 `M.mount(dv, html, style, {search, D})`，没给 `D` 时不显示开关

- [ ] **Step 1: 写失败的测试** `test_mobile_capture_switch_and_todo_add`：m.js 含 `aria-pressed` 和 `addTodo`；m-home/view.js 含 `aria-label="加一条待办"` 和 `kind === "ev"`
- [ ] **Step 2:** 运行，预期 FAIL
- [ ] **Step 3:** 实现：底栏「我想记…」左边同样的 `待办` 开关；手机首页今日待办加「＋」和圆点日程行，行为同 Task 3
- [ ] **Step 4:** 运行全部测试和 `python3 tools/lint_vault.py LifeOS`，预期 PASS、无输出
- [ ] **Step 5:** 预览检查：`?note=10 总部/手机/手机首页&today=2026-11-18&mobile=1`：开关按下后回车写出待办卡；「＋」能加；圆点行不能点
- [ ] **Step 6:** commit `feat: todo switch and add on mobile`
- [ ] **Step 7（和用户一起）:** 请 Charlotte 在 Obsidian 里刷新，试：首页「＋」加待办、开关记待办、翻到下下周加日程、打勾再取消
