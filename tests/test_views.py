import json
import re
import subprocess
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
VAULT = PROJECT / "LifeOS"
VIEWS = VAULT / "90 系统/views"
LIB = VIEWS / "_shared/lib.js"

# 主页面 → 分页面（UI 规范 7.6；分页面放在和主页面同名的文件夹里）
DASHBOARDS = {
    "10 总部/首页.md": [],
    "00 随手记/随手记.md": [],
    "10 总部/周复盘面板.md": [],
    "20 财务部/财务面板.md": ["20 财务部/财务面板/本周.md", "20 财务部/财务面板/2026 年.md"],
    "30 后勤部/食物墙.md": [],
    "30 后勤部/物品墙.md": [f"30 后勤部/物品墙/{c}.md" for c in ("电子", "小玩意", "衣物", "化妆品", "厨房")],
    "40 研发部/知识库.md": ["40 研发部/知识库/灵感.md", "40 研发部/知识库/胡思乱想.md"],
    "40 研发部/英语/英语面板.md": ["40 研发部/英语/英语面板/单词本.md", "40 研发部/英语/英语面板/错词本.md"],
    "45 教务处/教务面板.md": ["45 教务处/教务面板/截止日期.md", "45 教务处/教务面板/课件.md", "45 教务处/教务面板/笔记.md"],
    "50 人事部/求职.md": ["50 人事部/求职/面试.md", "50 人事部/求职/求职笔记.md"],
}
ALL_NOTES = list(DASHBOARDS) + [s for subs in DASHBOARDS.values() for s in subs]


def _view_calls(text: str) -> list[str]:
    return re.findall(r'dv\.view\("([^"]+)"', text)


def test_dashboard_notes_exist_and_are_marked():
    for rel in ALL_NOTES:
        text = (VAULT / rel).read_text(encoding="utf-8")
        assert re.search(r"cssclasses:\s*(\[lifeos-dash\]|\n\s*- lifeos-dash)", text), rel
        assert text.count("```dataviewjs") == 1, rel


def test_every_dashboard_calls_existing_view():
    for note in VAULT.rglob("*.md"):
        text = note.read_text(encoding="utf-8")
        if "lifeos-dash" not in text:
            continue
        for view in _view_calls(text):
            assert (VAULT / view / "view.js").is_file(), (note, view)


def test_view_js_syntax(tmp_path):
    for js in VIEWS.rglob("*.js"):
        wrapped = tmp_path / "check.js"
        wrapped.write_text("(async()=>{\n" + js.read_text(encoding="utf-8") + "\n})", encoding="utf-8")
        r = subprocess.run(["node", "--check", str(wrapped)], capture_output=True, text=True)
        assert r.returncode == 0, (js, r.stderr)


def test_every_subpage_has_tabs():
    for main, subs in DASHBOARDS.items():
        if not subs:
            continue
        for rel in [main] + subs:
            text = (VAULT / rel).read_text(encoding="utf-8")
            assert "90 系统/views/tabs" in text, rel
            args = json.loads(re.search(r'views/tabs", (\{.*?\})\)', text, re.S).group(1))
            labels = [p["label"] for p in args["pages"]]
            assert args["current"] in labels, rel
            assert not any(re.search(r"\d", l) for l in labels if not re.fullmatch(r"\d{4} 年|Fall \d{4}", l)), labels
            for p in args["pages"]:
                assert (VAULT / (p["path"] + ".md")).is_file(), (rel, p["path"])


def test_dashboard_notes_tracked_by_git():
    for rel in ALL_NOTES:
        r = subprocess.run(["git", "check-ignore", "-q", f"LifeOS/{rel}"], cwd=PROJECT)
        assert r.returncode == 1, rel


def _lib(expr: str):
    script = f"const L = eval(require('fs').readFileSync({json.dumps(str(LIB))}, 'utf8'));\nconsole.log(JSON.stringify({expr}));"
    out = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


CARDS = """[
  {name:"a", type:"活动", date:"2026-11-29"},
  {name:"b", type:"活动", date:"2026-11-10"},
  {name:"c", type:"活动"},
  {name:"d", type:"活动", date:"2026-11-21"},
  {name:"e", type:"备忘", date:"2026-11-19"},
  {name:"f", type:"活动", date:"2026-12-06"},
  {name:"g", type:"活动", date:"2026-12-20"}
]"""


def test_upcoming_events():
    names = _lib(f'L.upcomingEvents({CARDS}, "2026-11-18").map(c => c.name)')
    assert names == ["d", "a", "f"]  # 过期的、没写日期的、不是活动的都不要；最多 3 条，按日期升序


def test_upcoming_events_includes_today():
    assert _lib('L.upcomingEvents([{name:"t", type:"活动", date:"2026-11-18"}], "2026-11-18").length') == 1


def test_reminders():
    cards = """[
      {name:"pinned-open", type:"备忘", pinned:true, open:2},
      {name:"pinned-done", type:"备忘", pinned:true, open:0},
      {name:"list-open", type:"清单", pinned:false, open:3},
      {name:"note-unpinned", type:"灵感", pinned:false, open:1}
    ]"""
    assert _lib(f"L.reminders({cards}).map(c => c.name)") == ["pinned-open"]


def test_lib_parses_same_formats_as_python():
    entry = _lib('L.parseLedger("- 2026-11-18 奶茶 [金额:: $6.50] [分类:: 餐饮] [方式:: ApplePay]")')
    assert entry == {"date": "2026-11-18", "name": "奶茶", "amount": 6.5, "category": "餐饮", "method": "ApplePay"}
    assert _lib('L.parseLedger("- 2026-11-18 奶茶 [分类:: 餐饮]")') is None
    food = _lib('L.parseFood("- [x] 草莓 [数量:: 250 g] [到期:: 2026-11-22] [位置:: 冷藏] [类别:: 水果]")')
    assert food == {"done": True, "name": "草莓", "qty": "250 g", "expires": "2026-11-22", "place": "冷藏", "kind": "水果"}
    dl = _lib('L.parseDeadline("- [ ] DATA 101 作业 4 [截止:: 2026-11-18 23:59] [课程:: DATA 101]")')
    assert dl == {"done": False, "title": "DATA 101 作业 4", "due": "2026-11-18 23:59", "course": "DATA 101"}


def test_lib_days_left_and_money():
    assert _lib('[L.daysLeft("2026-11-19", "2026-11-18"), L.daysLeft("2026-11-18", "2026-11-18"), L.daysLeft("2026-11-10", "2026-11-18")]') == [1, 0, -8]
    assert _lib('[L.money(812.4), L.money(1400), L.money(6.5)]') == ["$812.40", "$1,400.00", "$6.50"]
    assert _lib('L.leftLabel(1)') == "明天过期"


def test_no_banned_copy_in_views():
    banned = ["示例", "过期自动隐藏", "点上面的", "可以不填", "继续投", "不急，但别忘", "一张卡只放一个分类"]
    for js in VIEWS.rglob("*.js"):
        text = js.read_text(encoding="utf-8")
        for word in banned:
            assert word not in text, (js, word)


def test_no_external_urls_in_views():
    for js in VIEWS.rglob("*.js"):
        text = js.read_text(encoding="utf-8")
        assert not re.search(r"https?://(?!www\.w3\.org/2000/svg|localhost[:/]|127\.0\.0\.1[:/])", text), js


def test_lib_iso_week():
    assert _lib('[L.isoWeek("2026-11-18"), L.isoWeek("2026-11-22"), L.isoWeek("2026-11-23"), L.isoWeek("2027-01-01")]') == \
        ["2026-W47", "2026-W47", "2026-W48", "2026-W53"]
    assert _lib('[L.weekMonday("2026-W47"), L.weekMonday("2026-W01")]') == ["2026-11-16", "2025-12-29"]


# ---------- 手机端（Task 6） ----------
MOBILE = {
    "手机首页": "m-home", "冰箱": "m-fridge", "所有部门": "m-more", "随手记": "m-inbox", "每周复盘": "m-review",
    "物品墙": "m-things", "知识库": "m-notes", "多邻国": "m-english", "教务处": "m-school", "人事部": "m-career",
}
PRIVATE_NOTE = "60 个人档案/个人档案"  # 不检查它在不在：脚本不碰 60 个人档案（Task 7 由用户自己建）


def test_mobile_pages_exist():
    for name, view in MOBILE.items():
        rel = f"10 总部/手机/{name}.md"
        text = (VAULT / rel).read_text(encoding="utf-8")
        assert re.search(r"cssclasses:\s*(\[lifeos-dash\]|\n\s*- lifeos-dash)", text), rel
        assert _view_calls(text) == [f"90 系统/views/{view}"], rel
        assert (VIEWS / view / "view.js").is_file(), view
        r = subprocess.run(["git", "check-ignore", "-q", f"LifeOS/{rel}"], cwd=PROJECT)
        assert r.returncode == 1, rel


def test_more_page_links_exist():
    text = (VIEWS / "m-more/view.js").read_text(encoding="utf-8")
    targets = re.findall(r'to: "([^"]+)"', text)
    assert PRIVATE_NOTE in targets
    assert {f"10 总部/手机/{n}" for n in MOBILE if n not in ("手机首页", "所有部门")} <= set(targets)
    for t in targets:
        if t != PRIVATE_NOTE:
            assert (VAULT / f"{t}.md").is_file(), t


def test_mobile_fridge_single_page():
    text = (VIEWS / "m-fridge/view.js").read_text(encoding="utf-8")
    assert "views/tabs" not in text and 'class="tabs' not in text and 'class="seg' not in text
    pos = [text.find(f'"{w}"') for w in ("冷藏", "冷冻", "常温", "购物清单")]
    assert all(p >= 0 for p in pos) and pos == sorted(pos), pos


def test_mobile_plus_menu():
    text = (VIEWS / "_shared/m.js").read_text(encoding="utf-8")
    assert "shortcuts://run-shortcut?name=" in text and "记一笔" in text
    assert "10 总部/手机/冰箱" in text


EVENT_LINES = ["- 2026-11-29 15:00 和朋友吃饭 [地点:: Bahen]", "- 2026-11-29 和朋友吃饭", "- 11-29 吃饭", "- 2026-11-29 25:00 吃饭", "- 2026-11-29"]


def test_lib_event_matches_python():
    import sys
    sys.path.insert(0, str(PROJECT / "tools"))
    from lifeos_formats import parse_event_line
    js = _lib(f"{json.dumps(EVENT_LINES, ensure_ascii=False)}.map(s => L.parseEvent(s))")
    for line, j in zip(EVENT_LINES, js):
        p = parse_event_line(line)
        if p is None:
            assert j is None, line
        else:
            assert j == {"date": p.date.isoformat(), "time": p.time or "", "title": p.title, "place": p.place}, line
    assert _lib(f'L.formatEvent(L.parseEvent({json.dumps(EVENT_LINES[0], ensure_ascii=False)}))') == EVENT_LINES[0]


def test_safe_title():
    assert _lib('L.safeTitle("a/b:c?\\n#d")') == "a b c d"
    assert _lib('L.safeTitle("   ")') == "随手记"
    assert _lib('L.safeTitle("x".repeat(60)).length') <= 40


def test_todo_cards_filter():
    cards = """[
      {name:"any", type:"待办", done:false, date:"", doneOn:""},
      {name:"today", type:"待办", done:false, date:"2026-11-18", doneOn:""},
      {name:"tomorrow", type:"待办", done:false, date:"2026-11-19", doneOn:""},
      {name:"doneToday", type:"待办", done:true, date:"", doneOn:"2026-11-18"},
      {name:"doneBefore", type:"待办", done:true, date:"", doneOn:"2026-11-17"},
      {name:"memo", type:"备忘", done:false, date:"", doneOn:""}
    ]"""
    assert _lib(f'L.todoCards({cards}, "2026-11-18").map(c => c.name)') == ["any", "today", "doneToday"]


def test_week_label():
    assert _lib('L.weekLabel("2026-11-16")') == "2026年11月 · 16–22日"
    assert _lib('L.weekLabel("2026-11-30")') == "2026年11月30日–12月6日"


def test_week_label_cross_year():
    assert _lib('L.weekLabel("2026-12-28")') == "2026年12月28日–2027年1月3日"


def test_home_has_todo_add_and_capture_switch():
    js = (VIEWS / "home/view.js").read_text(encoding="utf-8")
    for s in ('aria-label="加一条待办"', "D.addTodo(", "aria-pressed", 'kind === "ev"'):
        assert s in js, s


def test_home_calendar_week_nav():
    js = (VIEWS / "home/view.js").read_text(encoding="utf-8")
    for s in ('aria-label="上一周"', 'aria-label="下一周"', "回到本周", 'aria-label="加日程"', "D.addEvent(", "L.weekLabel("):
        assert s in js, s


def test_done_last():
    assert _lib('L.doneLast([{n:1,done:true},{n:2},{n:3,done:true},{n:4}]).map(x => x.n)') == [2, 4, 1, 3]


def test_chunk():
    assert _lib("L.chunk([1,2,3,4,5], 2)") == [[1, 2], [3, 4], [5]]
    assert _lib("L.chunk([], 4)") == []


def test_lib_has_scroll_helpers():
    js = LIB.read_text(encoding="utf-8")
    for s in ("function pager", "function scrolly", "function sinkDone"):
        assert s in js, s


def test_home_uses_scroll_and_pager():
    js = (VIEWS / "home/view.js").read_text(encoding="utf-8")
    for s in ("L.scrolly(", "L.pager(", "L.sinkDone(", "L.doneLast("):
        assert s in js, s
    assert "还有 ${" not in js


def test_walls_use_pager():
    for v in ("fridge", "things", "notes"):
        assert "L.pager(" in (VIEWS / f"{v}/view.js").read_text(encoding="utf-8"), v


def test_lists_sink_done():
    for v in ("fridge", "school", "career", "inbox"):
        assert "L.sinkDone(" in (VIEWS / f"{v}/view.js").read_text(encoding="utf-8"), v


def test_long_lists_scroll():
    for v in ("english", "school", "finance"):
        assert "L.scrolly(" in (VIEWS / f"{v}/view.js").read_text(encoding="utf-8"), v


def test_home_plus_for_fridge_and_activities():
    js = (VIEWS / "home/view.js").read_text(encoding="utf-8")
    for s in ('aria-label="放进冰箱"', 'aria-label="加活动"', "D.addFood(", "D.addActivity("):
        assert s in js, s


def test_lib_format_ledger_matches_python():
    import sys
    sys.path.insert(0, str(PROJECT / "tools"))
    from datetime import date
    from decimal import Decimal
    from lifeos_formats import LedgerEntry, format_ledger
    py = format_ledger(LedgerEntry(date(2026, 11, 21), "煎饼果子", Decimal("6.5"), "餐饮", "现金"))
    js = _lib('L.formatLedger({date:"2026-11-21", name:"煎饼果子", amount:6.5, category:"餐饮", method:"现金"})')
    assert js == py
    assert _lib(f"L.parseLedger({json.dumps(py, ensure_ascii=False)}).method") == "现金"


def test_money_sheet_used_on_home_and_finance():
    for v in ("home", "finance"):
        assert "L.moneySheet(" in (VIEWS / f"{v}/view.js").read_text(encoding="utf-8"), v
    js = LIB.read_text(encoding="utf-8")
    for s in ("现金", "ApplePay", "<dialog"):
        assert s in js, s
