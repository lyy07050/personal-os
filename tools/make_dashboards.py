"""生成面板笔记（每篇只有一个 dataviewjs 块）。用法：python3 tools/make_dashboards.py LifeOS

面板笔记属于「系统」，进 git；重跑会覆盖它们（它们里面没有数据）。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# (主页面, 主页面 tab 名, view, 主页面参数, [(分页面, tab 名, 参数)])
PAGES = [
    ("10 总部/首页", None, "home", {}, []),
    ("00 随手记/随手记", None, "inbox", {}, []),
    ("10 总部/周复盘面板", None, "review", {"mode": "index"}, []),
    ("30 后勤部/食物墙", None, "fridge", {}, []),
    ("20 财务部/财务面板", "Month", "finance", {"period": "month"},
     [("20 财务部/财务面板/本周", "Week", {"period": "week"}), ("20 财务部/财务面板/2026 年", "Year", {"period": "year"})]),
    ("30 后勤部/物品墙", "全部", "things", {},
     [(f"30 后勤部/物品墙/{c}", c, {"category": c}) for c in ("电子", "小玩意", "衣物", "化妆品", "厨房")]),
    ("40 研发部/知识库", "知识卡", "notes", {"section": "cards"},
     [("40 研发部/知识库/灵感", "灵感", {"section": "ideas"}), ("40 研发部/知识库/胡思乱想", "胡思乱想", {"section": "thoughts"})]),
    ("40 研发部/英语/英语面板", "Today", "english", {"section": "today"},
     [("40 研发部/英语/英语面板/单词本", "Words", {"section": "words"}), ("40 研发部/英语/英语面板/错词本", "Mistakes", {"section": "mistakes"})]),
    ("45 教务处/教务面板", "Fall 2026", "school", {"section": "term"},
     [("45 教务处/教务面板/截止日期", "Deadlines", {"section": "deadlines"}), ("45 教务处/教务面板/课件", "Files", {"section": "files"}),
      ("45 教务处/教务面板/笔记", "笔记", {"section": "notes"})]),
    ("50 人事部/求职", "Pipeline", "career", {"section": "pipeline"},
     [("50 人事部/求职/面试", "Interviews", {"section": "interviews"}), ("50 人事部/求职/求职笔记", "Notes", {"section": "notes"})]),
]


# 手机页面：10 总部/手机/<名字> → views/m-<view>（没有 tab，返回键在页面里）
MOBILE = [("手机首页", "home"), ("冰箱", "fridge"), ("所有部门", "more"), ("随手记", "inbox"), ("每周复盘", "review"),
          ("物品墙", "things"), ("知识库", "notes"), ("多邻国", "english"), ("教务处", "school"), ("人事部", "career")]


def note(calls: list[tuple[str, dict]]) -> str:
    body = "\n".join(f'await dv.view("90 系统/views/{v}", {json.dumps(a, ensure_ascii=False)})' for v, a in calls)
    return f"---\ncssclasses:\n  - lifeos-dash\n---\n```dataviewjs\n{body}\n```\n"


def all_notes() -> dict[str, str]:
    out = {}
    for main, label, view, args, subs in PAGES:
        if not subs:
            out[main] = note([(view, args)])
            continue
        tabs = [{"label": label, "path": main}] + [{"label": l, "path": p} for p, l, _ in subs]
        out[main] = note([("tabs", {"current": label, "pages": tabs}), (view, args)])
        for path, l, a in subs:
            out[path] = note([("tabs", {"current": l, "pages": tabs}), (view, a)])
    for name, view in MOBILE:
        out[f"10 总部/手机/{name}"] = f'---\ncssclasses:\n  - lifeos-dash\n---\n```dataviewjs\nawait dv.view("90 系统/views/m-{view}")\n```\n'
    return out


def main(root: Path) -> list[str]:
    for rel, text in all_notes().items():
        p = root / f"{rel}.md"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")
    return list(all_notes())


if __name__ == "__main__":
    for rel in main(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("LifeOS")):
        print(rel)
