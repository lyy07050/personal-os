import re
from pathlib import Path

from lifeos_formats import HABITS, frontmatter
from lint_vault import lint_vault

TEMPLATES = Path(__file__).resolve().parent.parent / "LifeOS/90 系统/模板"

# 模板 → 用它新建的笔记会放在哪里（用来跑 lint）
TARGETS = {
    "日记": "10 总部/日记/2026-11-18.md",
    "周复盘": "10 总部/复盘/2026-W47.md",
    "事情": "10 总部/项目/示例.md",
    "物品": "30 后勤部/物品/示例.md",
    "随手记卡片": "00 随手记/示例.md",
    "课程主页": "45 教务处/课程/INF 1340 示例/课程主页.md",
    "课堂笔记": "45 教务处/课程/INF 1340 示例/2026-11-18.md",
    "胡思乱想": "40 研发部/胡思乱想/2026-11-18.md",
    "知识卡": "40 研发部/知识卡/示例.md",
}

_DATE_FORMATS = {"YYYY-MM-DD": "2026-11-18", "GGGG-[W]WW": "2026-W47", "M 月 D 日": "11 月 18 日",
                 "YYYY-MM-DD HH:mm": "2026-11-18 09:00"}


def render(text: str) -> str:
    """把 Templater 语法换成固定值：日期 → 2026-11-18；下拉选择 → 第一个选项；<%* … %> 脚本块 → 删掉。"""
    def one(m: re.Match) -> str:
        if m.group(1) == "*":
            return ""
        code = m.group(2)
        if (d := re.search(r'tp\.date\.now\("([^"]+)"', code)):
            return _DATE_FORMATS[d.group(1)]
        if "tp.system.suggester" in code:
            return re.findall(r'\[\s*"([^"]+)"', code)[-1]
        return "示例"
    return re.sub(r"<%([*_-]?)\s*(.*?)\s*-?%>", one, text, flags=re.S)


def read(name: str) -> str:
    return (TEMPLATES / f"{name}.md").read_text(encoding="utf-8")


def test_all_templates_exist():
    assert sorted(p.stem for p in TEMPLATES.glob("*.md")) == sorted(TARGETS)


def test_daily_template_has_habit_fields():
    meta = frontmatter(render(read("日记")))
    assert meta["date"] == "2026-11-18"
    for habit in HABITS:
        assert meta[habit] == "false", habit


def test_review_template_three_goals():
    text = render(read("周复盘"))
    body = text.split("## 下周三件要事", 1)[1]
    first_section = body.split("\n## ", 1)[0]
    goals = [l for l in first_section.splitlines() if l.startswith("- [ ]")]
    assert len(goals) == 3
    assert all("[来源:: 复盘]" in g for g in goals)
    assert 'dv.view("90 系统/views/review")' in text
    # 下周三件要事是第一节
    assert text.index("## 下周三件要事") == text.index("## ")


def test_inbox_card_template_type():
    meta = frontmatter(render(read("随手记卡片")))
    assert meta["type"] == "备忘"
    assert meta["pinned"] == "false"


def test_templates_render_samples_lint_clean(tmp_path):
    for name, target in TARGETS.items():
        p = tmp_path / target
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(render(read(name)), encoding="utf-8")
    assert lint_vault(tmp_path) == []


def test_templates_have_no_sample_tag():
    for name in TARGETS:
        assert "示例" not in read(name), name
