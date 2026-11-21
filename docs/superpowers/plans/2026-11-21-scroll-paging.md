# 卡片滑动、翻页、勾完排后面 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** 列表卡片可上下滑、格子卡片可 ‹ › 翻页、打勾后做完的排到后面。
**Architecture:** `lib.js` 加纯函数和 DOM 小工具，`lifeos.css` 加通用样式，各 view 套用。
**Tech Stack:** dataviewjs、原生 JS / CSS、pytest + node。
**Spec:** `docs/superpowers/specs/2026-11-21-scroll-paging-design.md`

## Global Constraints
- view.js 不出现「示例」「过期自动隐藏」「点上面的」「可以不填」「继续投」和 `http`。
- 样式选择器都带 `.lifeos-dash`（`test_css_scoped_to_dashboards`）。
- 只改显示顺序，不改数据文件的行顺序。
- `prefers-reduced-motion` 时不做滑动动画。
- 测试 `tools/.venv/bin/pytest -q`；提交带 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`。

## Review Focus
1. 翻页容器只有 1 页 → 不显示箭头和页码（Task 1 `test_chunk`、手动检查）。
2. 刚加进来的待办（Task 3 的 `addRow`）也能勾、也会排到后面（Task 2 手动检查）。
3. 连续快速勾两行 → 两行都排到后面，顺序不乱（Task 1 `sinkDone` 用当前 DOM 位置计算）。
4. 卡片内容少于固定高度 → 不出现滚动条、底部不淡出（Task 1 `L.fade`）。
5. 食物墙某分类「吃完」一样后，页码跟着变（Task 3 手动检查）。

---

### Task 1: 通用工具和样式
**Files:** `LifeOS/90 系统/views/_shared/lib.js`、`LifeOS/.obsidian/snippets/lifeos.css`、`tests/test_views.py`
**Produces:**
- `L.doneLast(items) -> items`：稳定排序，`done` 为真的放后面
- `L.chunk(arr, n) -> arr[][]`：`chunk([], n)` → `[]`
- `L.scrolly(el)`：给 el 加 class `scrolly`，滚动 / 尺寸变化时切换 `at-end`（内容不溢出也算 at-end）
- `L.pager(el, perPage)`：把 el 的子元素按 `perPage` 分进 `.page`，放进横向 scroll-snap `.pages` 轨道，外加 `.pg` 控件（`‹` `aria-label="上一页"`、`n / m`、`›` `aria-label="下一页"`）；只有 1 页不加控件；返回 `{refresh()}`（子元素变了重新分页）
- `L.sinkDone(li)`：0.6 s 后把 li 移到父列表最后（`done`）或移到第一个 `.done` 之前（没做）
- CSS：`.scrolly`（`overflow-y:auto;overscroll-behavior:contain`，未到底时底部 28px 渐隐遮罩）、`.pages`、`.page`、`.pg`
- [ ] Step 1 测试：`test_done_last`（`[{n:1,done:true},{n:2},{n:3,done:true},{n:4}]` → `[2,4,1,3]`）、`test_chunk`（`chunk([1,2,3,4,5],2)` → `[[1,2],[3,4],[5]]`；`chunk([],4)` → `[]`）；`test_lib_has_scroll_helpers`（lib.js 含 `function pager`、`function scrolly`、`function sinkDone`）
- [ ] Step 2 运行，FAIL；Step 3 实现；Step 4 运行全部，PASS；Step 5 commit `feat: scroll, paging and done-last helpers`

### Task 2: 首页
**Files:** `LifeOS/90 系统/views/home/view.js`、`tests/test_views.py`
- 今日待办：全部显示（不再 slice）、`L.doneLast` 排序、列表 `L.scrolly`（高度和本周日程卡对齐）、勾选后 `L.sinkDone`
- Reminder：每个清单全部条目（去掉「还有 N 项 →」）、清单内 `doneLast`、整块 `scrolly`、勾选后 `sinkDone`
- 最近的活动：显示全部未来活动（不再只 3 条）、`scrolly`
- 事情进度：`scrolly`（最多露 5 行）
- Fridge：冷藏全部、`L.pager(…, 4)`；「吃完」后 `refresh()`
- [ ] Step 1 测试 `test_home_uses_scroll_and_pager`：含 `L.scrolly(`、`L.pager(`、`L.sinkDone(`、`L.doneLast(`，不含 `还有 ${`
- [ ] Step 2 FAIL；Step 3 实现；Step 4 PASS；Step 5 预览检查（宽 1500：待办能滚、Reminder 能滚、Fridge 有 ‹ ›、勾一行 0.6 s 后到最后）；Step 6 commit `feat: scrolling and paging on the home page`

### Task 3: 其他面板
**Files:** `views/{fridge,things,notes,english,school,finance,career,inbox}/view.js`、`tests/test_views.py`
- 食物墙：每个分类框 `L.pager(ul, 5)`，「吃完」后 `refresh()`；购物清单 `doneLast` + `sinkDone`
- 物品墙：`L.pager(items, 6)`（按位置分组时每组各自翻页）
- 知识库「最近的知识卡」：`L.pager(…, 一页的卡数)`
- 多邻国单词本 / 错词本、教务处截止时间线、财务账单明细：`L.scrolly`
- 教务处截止、面试准备、随手记清单：`doneLast` + `sinkDone`
- [ ] Step 1 测试 `test_walls_use_pager`（fridge、things、notes 含 `L.pager(`）、`test_lists_sink_done`（fridge、school、career、inbox 含 `L.sinkDone(`）
- [ ] Step 2 FAIL；Step 3 实现；Step 4 PASS；Step 5 预览检查每个页面；Step 6 commit `feat: scrolling, paging and done-last on department pages`
