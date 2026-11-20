"""人生 OS 的数据格式：一处定义，解析、校验、生成都用这里。"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

CATEGORIES = ("餐饮", "交通", "购物", "服饰", "日用", "美妆", "娱乐", "学习", "居住", "其他", "待分类")
ITEM_CATEGORIES = ("电子", "小玩意", "衣物", "化妆品", "厨房")
NOTE_CATEGORIES = ("生活小知识", "体态", "变美", "多伦多生活", "回国吃喝玩乐", "学习", "求职")
INBOX_TYPES = ("活动", "备忘", "灵感", "链接", "清单")
STAGES = ("想投", "已投递", "面试中", "Offer")
PLACES = ("冷藏", "冷冻", "常温")
FOOD_KINDS = ("生鲜", "水果", "调味料", "粉面速食", "药材", "零食")
HABITS = ("早起", "喝水", "运动", "背词", "早睡")
NO_DATE = "无"

_FIELD = re.compile(r"\[([^\[\]:]+?)::\s*([^\[\]]*?)\]")
_LEDGER = re.compile(r"^- (\d{4}-\d{2}-\d{2}) (.+?) (?=\[)")
_TASK = re.compile(r"^- \[( |x)\] (.+?) (?=\[)")


@dataclass(frozen=True)
class LedgerEntry:
    date: date
    name: str
    amount: Decimal
    category: str
    method: str


@dataclass(frozen=True)
class FoodItem:
    done: bool
    name: str
    qty: str
    expires: date | None
    place: str
    kind: str = ""


@dataclass(frozen=True)
class Deadline:
    done: bool
    title: str
    due: datetime | None
    course: str


def fields(line: str) -> dict[str, str]:
    """行内字段 `[键:: 值]` → dict。"""
    return {k.strip(): v.strip() for k, v in _FIELD.findall(line)}


def parse_amount(text: str) -> Decimal | None:
    try:
        value = Decimal(text.replace("$", "").replace(",", "").strip())
    except InvalidOperation:
        return None
    return value if value.is_finite() else None


def parse_day(text: str) -> date | None:
    try:
        return date.fromisoformat(text)
    except ValueError:
        return None


def parse_ledger_line(line: str) -> LedgerEntry | None:
    m = _LEDGER.match(line)
    if not m:
        return None
    f = fields(line)
    day = parse_day(m.group(1))
    amount = parse_amount(f.get("金额", ""))
    if day is None or amount is None or "分类" not in f:
        return None
    return LedgerEntry(day, m.group(2).strip(), amount, f["分类"], f.get("方式", ""))


def parse_food_line(line: str) -> FoodItem | None:
    m = _TASK.match(line)
    if not m:
        return None
    f = fields(line)
    if "位置" not in f or "到期" not in f:
        return None
    raw = f["到期"]
    expires = None if raw == NO_DATE else parse_day(raw)
    if expires is None and raw != NO_DATE:
        return None
    return FoodItem(m.group(1) == "x", m.group(2).strip(), f.get("数量", ""), expires, f["位置"], f.get("类别", ""))


def parse_deadline_line(line: str) -> Deadline | None:
    m = _TASK.match(line)
    if not m:
        return None
    f = fields(line)
    if "截止" not in f or "课程" not in f:
        return None
    raw = f["截止"]
    if raw == NO_DATE:
        due = None
    else:
        try:
            due = datetime.strptime(raw, "%Y-%m-%d %H:%M")
        except ValueError:
            return None
    return Deadline(m.group(1) == "x", m.group(2).strip(), due, f["课程"])


def format_deadline(d: Deadline) -> str:
    due = d.due.strftime("%Y-%m-%d %H:%M") if d.due else NO_DATE
    return f"- [{'x' if d.done else ' '}] {d.title} [截止:: {due}] [课程:: {d.course}]"


def format_ledger(e: LedgerEntry) -> str:
    return f"- {e.date.isoformat()} {e.name} [金额:: {e.amount:.2f}] [分类:: {e.category}] [方式:: {e.method}]"


def format_food(f: FoodItem) -> str:
    exp = f.expires.isoformat() if f.expires else NO_DATE
    kind = f" [类别:: {f.kind}]" if f.kind else ""
    return f"- [{'x' if f.done else ' '}] {f.name} [数量:: {f.qty}] [到期:: {exp}] [位置:: {f.place}]{kind}"


def frontmatter(text: str) -> dict[str, str] | None:
    """最简单的 YAML frontmatter：只认 `键: 值` 一层，够本仓库用。"""
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---", 4)
    if end == -1:
        return None
    out: dict[str, str] = {}
    for raw in text[4:end].splitlines():
        if ":" in raw and not raw.startswith((" ", "-")):
            k, v = raw.split(":", 1)
            out[k.strip()] = v.strip()
    return out
