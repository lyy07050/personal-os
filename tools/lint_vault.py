"""校验仓库里的数据格式。用法：python3 tools/lint_vault.py LifeOS（有错返回 1）。

永远不进入 `60 个人档案` 和 `课件`。
"""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass
from pathlib import Path

from lifeos_formats import (CATEGORIES, FOOD_KINDS, INBOX_TYPES, ITEM_CATEGORIES, NOTE_CATEGORIES, PLACES, STAGES,
                            EVENTS_PATH, EVENT_KINDS, fields, frontmatter, parse_day, parse_deadline_line, parse_event_line, parse_food_line,
                            parse_ledger_line)

SKIP_DIRS = {"60 个人档案", "课件", ".obsidian", ".trash"}


@dataclass(frozen=True)
class LintError:
    path: Path
    line: int
    message: str

    def __str__(self) -> str:
        return f"{self.path}:{self.line}: {self.message}"


def _md_files(root: Path):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS)
        for name in sorted(filenames):
            if name.endswith(".md"):
                yield Path(dirpath) / name


def _check_ledger(path: Path, lines: list[str]) -> list[LintError]:
    errors = []
    for n, line in enumerate(lines, 1):
        if not line.startswith("- 20"):
            continue
        if "：：" in line or "金额" not in fields(line):
            errors.append(LintError(path, n, "金额写错了：要写成 [金额:: 18.50]（半角冒号，两个）"))
            continue
        entry = parse_ledger_line(line)
        if entry is None:
            errors.append(LintError(path, n, "记账行格式不对：- 日期 名称 [金额:: 数字] [分类:: 分类] [方式:: 方式]"))
        elif entry.category not in CATEGORIES:
            errors.append(LintError(path, n, f"分类「{entry.category}」不在分类表里：{'、'.join(CATEGORIES)}"))
    return errors


def _check_food(path: Path, lines: list[str]) -> list[LintError]:
    errors = []
    for n, line in enumerate(lines, 1):
        if not line.startswith("- ["):
            continue
        item = parse_food_line(line)
        if item is None:
            errors.append(LintError(path, n, "食物行格式不对：- [ ] 名称 [数量:: 1 L] [到期:: 2026-11-19 或 无] [位置:: 冷藏]"))
        elif item.place not in PLACES:
            errors.append(LintError(path, n, f"位置只能是 {' / '.join(PLACES)}"))
        elif item.kind and item.kind not in FOOD_KINDS:
            errors.append(LintError(path, n, f"类别只能是 {' / '.join(FOOD_KINDS)}"))
    return errors


def _check_deadlines(path: Path, lines: list[str]) -> list[LintError]:
    errors = []
    for n, line in enumerate(lines, 1):
        if line.startswith("- [") and parse_deadline_line(line) is None:
            errors.append(LintError(path, n, "截止行格式不对：- [ ] 标题 [截止:: 2026-11-18 23:59 或 无] [课程:: 课程]"))
    return errors


def _check_meta(path: Path, text: str, key: str, allowed: tuple[str, ...]) -> list[LintError]:
    meta = frontmatter(text)
    if meta is None:
        return [LintError(path, 1, "缺少 frontmatter（文件开头的 --- 段）")]
    value = meta.get(key, "")
    if value not in allowed:
        return [LintError(path, 1, f"{key}「{value}」只能是：{' / '.join(allowed)}")]
    return []


def _check_inbox(path: Path, text: str) -> list[LintError]:
    errors = _check_meta(path, text, "type", INBOX_TYPES)
    meta = frontmatter(text) or {}
    if not errors and meta.get("date") and parse_day(meta["date"]) is None:
        errors.append(LintError(path, 1, "date 要写成 YYYY-MM-DD"))
    if not errors and meta.get("type") == "待办":
        if meta.get("done", "") not in ("true", "false"):
            errors.append(LintError(path, 1, "待办的 done 只能是 true / false"))
        if meta.get("done_on") and parse_day(meta["done_on"]) is None:
            errors.append(LintError(path, 1, "done_on 要写成 YYYY-MM-DD"))
    return errors


def _check_events(path: Path, lines: list[str]) -> list[LintError]:
    """日程.md：每个 `- ` 开头的行都要是 `- YYYY-MM-DD[ HH:MM] 事情[ [地点:: …]]`。"""
    out = []
    for i, line in enumerate(lines, 1):
        if not line.startswith("- "):
            continue
        e = parse_event_line(line)
        if e is None:
            out.append(LintError(path, i, "日程这一行要写成 - YYYY-MM-DD[ HH:MM] 事情"))
        elif e.kind and e.kind not in EVENT_KINDS:
            out.append(LintError(path, i, f"类别只能是：{'、'.join(EVENT_KINDS)}"))
    return out


def lint_file(root: Path, path: Path) -> list[LintError]:
    rel = path.relative_to(root).as_posix()
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    lines = text.splitlines()
    if rel.startswith("20 财务部/账本/"):
        return _check_ledger(path, lines)
    if rel == "30 后勤部/食物.md":
        return _check_food(path, lines)
    if rel == EVENTS_PATH:
        return _check_events(path, lines)
    if rel == "45 教务处/截止日期.md":
        return _check_deadlines(path, lines)
    if rel.startswith("30 后勤部/物品/"):
        return _check_meta(path, text, "category", ITEM_CATEGORIES)
    if rel.startswith("40 研发部/知识卡/"):
        return _check_meta(path, text, "category", NOTE_CATEGORIES)
    if rel.startswith("50 人事部/投递/"):
        return _check_meta(path, text, "stage", STAGES)
    if rel.startswith("00 随手记/") and rel.count("/") == 1 and rel != "00 随手记/随手记.md":
        return _check_inbox(path, text)
    return []


def lint_vault(root: Path) -> list[LintError]:
    root = Path(root)
    errors: list[LintError] = []
    for path in _md_files(root):
        errors.extend(lint_file(root, path))
    return errors


def main(argv: list[str]) -> int:
    root = Path(argv[1]) if len(argv) > 1 else Path("LifeOS")
    errors = lint_vault(root)
    for e in errors:
        print(e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
