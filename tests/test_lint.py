import builtins
from pathlib import Path

import make_samples
from lint_vault import lint_vault


def write(root: Path, rel: str, text: str) -> Path:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")
    return p


def test_lint_flags_bad_ledger_line(tmp_path):
    write(tmp_path, "20 财务部/账本/2026-11.md",
          "# 2026 年 11 月\n- 2026-11-01 地铁 [金额:: 3.35] [分类:: 交通] [方式:: ApplePay]\n"
          "- 2026-11-02 奶茶 [金额：： 18] [分类:: 餐饮] [方式:: ApplePay]\n")
    errors = lint_vault(tmp_path)
    assert len(errors) == 1
    assert errors[0].line == 3
    assert "金额" in errors[0].message


def test_lint_flags_unknown_category(tmp_path):
    write(tmp_path, "20 财务部/账本/2026-11.md",
          "- 2026-11-02 薯片 [金额:: 4] [分类:: 零食] [方式:: ApplePay]\n")
    errors = lint_vault(tmp_path)
    assert len(errors) == 1 and "分类" in errors[0].message


def test_lint_flags_bad_food_line(tmp_path):
    write(tmp_path, "30 后勤部/食物.md", "## 冷藏\n- [ ] 牛奶 [数量:: 1 L] [到期:: 明天] [位置:: 冷藏]\n")
    errors = lint_vault(tmp_path)
    assert len(errors) == 1 and errors[0].line == 2


def test_lint_flags_bad_item_category(tmp_path):
    write(tmp_path, "30 后勤部/物品/Kindle.md", "---\ncategory: 书\nlocation: 书桌\n---\n")
    errors = lint_vault(tmp_path)
    assert len(errors) == 1 and "category" in errors[0].message


def test_lint_flags_inbox_type(tmp_path):
    write(tmp_path, "00 随手记/买菜.md", "---\ntype: 待办\npinned: false\n---\n买菜\n")
    errors = lint_vault(tmp_path)
    assert len(errors) == 1 and "type" in errors[0].message


def test_lint_flags_event_without_date_is_ok(tmp_path):
    # 活动没写日期不算错：首页只是不显示它
    write(tmp_path, "00 随手记/市集.md", "---\ntype: 活动\npinned: false\n---\n周末市集\n")
    assert lint_vault(tmp_path) == []


def test_lint_skips_private_folder(tmp_path, monkeypatch):
    write(tmp_path, "60 个人档案/账号密码.md", "- 2026-11-02 坏行 [金额：： x]\n")
    write(tmp_path, "45 教务处/课件/a.md", "- 2026-11-02 坏行 [金额：： x]\n")
    real_open = builtins.open

    def guarded_open(file, *args, **kwargs):
        assert "60 个人档案" not in str(file) and "课件" not in str(file), file
        return real_open(file, *args, **kwargs)

    monkeypatch.setattr(builtins, "open", guarded_open)
    assert lint_vault(tmp_path) == []


def test_lint_clean_samples(tmp_path):
    make_samples.main(tmp_path)
    assert lint_vault(tmp_path) == []


def test_samples_match_mock_numbers(tmp_path):
    from decimal import Decimal
    from lifeos_formats import parse_ledger_line, parse_food_line
    make_samples.main(tmp_path)
    nov = [e for line in (tmp_path / "20 财务部/账本/2026-11.md").read_text(encoding="utf-8").splitlines()
           if (e := parse_ledger_line(line))]
    assert sum(e.amount for e in nov) == Decimal("812.40")
    week = [e for e in nov if e.date.isocalendar()[1] == 47]  # 2026-11-16 .. 11-22
    assert sum(e.amount for e in week) == Decimal("214.50")
    assert sum(1 for e in nov if e.category == "待分类") == 2
    food = [f for line in (tmp_path / "30 后勤部/食物.md").read_text(encoding="utf-8").splitlines()
            if (f := parse_food_line(line))]
    assert [sum(f.place == p for f in food) for p in ("冷藏", "冷冻", "常温")] == [6, 3, 6]
    assert not (tmp_path / "60 个人档案").exists() or not any((tmp_path / "60 个人档案").iterdir())


def test_samples_are_repeatable(tmp_path):
    a, b = tmp_path / "a", tmp_path / "b"
    make_samples.main(a)
    make_samples.main(b)
    files = sorted(p.relative_to(a) for p in a.rglob("*.md"))
    assert files == sorted(p.relative_to(b) for p in b.rglob("*.md"))
    for f in files:
        assert (a / f).read_text(encoding="utf-8") == (b / f).read_text(encoding="utf-8")
