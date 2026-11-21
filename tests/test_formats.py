from datetime import date, datetime
from decimal import Decimal

from lifeos_formats import (CATEGORIES, INBOX_TYPES, ITEM_CATEGORIES, NOTE_CATEGORIES, STAGES,
                            format_deadline, format_food, parse_deadline_line, parse_food_line, parse_ledger_line)


def test_parse_ledger_basic():
    e = parse_ledger_line("- 2026-11-18 奶茶 [金额:: 6.50] [分类:: 餐饮] [方式:: ApplePay]")
    assert e.date == date(2026, 11, 18)
    assert e.name == "奶茶"
    assert e.amount == Decimal("6.50")
    assert e.category == "餐饮"
    assert e.method == "ApplePay"


def test_parse_ledger_rejects_missing_amount():
    assert parse_ledger_line("- 2026-11-18 奶茶 [分类:: 餐饮]") is None


def test_parse_ledger_dollar_sign():
    e = parse_ledger_line("- 2026-11-18 外卖 [金额:: $18.50] [分类:: 餐饮] [方式:: 信用卡]")
    assert e.amount == Decimal("18.50")


def test_parse_ledger_ignores_other_lines():
    assert parse_ledger_line("# 2026 年 11 月") is None
    assert parse_ledger_line("") is None


def test_parse_food():
    f = parse_food_line("- [ ] 牛奶 [数量:: 1 L] [到期:: 2026-11-19] [位置:: 冷藏]")
    assert f.done is False
    assert f.name == "牛奶"
    assert f.qty == "1 L"
    assert f.expires == date(2026, 11, 19)
    assert f.place == "冷藏"


def test_parse_food_done_and_no_date():
    f = parse_food_line("- [x] 大米 [数量:: 2 kg] [到期:: 无] [位置:: 常温]")
    assert f.done is True
    assert f.expires is None


def test_deadline_roundtrip():
    s = "- [ ] DATA 101 作业 4 [截止:: 2026-11-18 23:59] [课程:: DATA 101]"
    d = parse_deadline_line(s)
    assert d.due == datetime(2026, 11, 18, 23, 59)
    assert d.course == "DATA 101"
    assert format_deadline(d) == s


def test_deadline_without_due():
    s = "- [x] INF 1340 阅读 [截止:: 无] [课程:: INF 1340]"
    d = parse_deadline_line(s)
    assert d.due is None and d.done is True
    assert format_deadline(d) == s


def test_constants():
    assert CATEGORIES == ("餐饮", "交通", "购物", "服饰", "日用", "美妆", "娱乐", "学习", "居住", "其他", "待分类")
    assert ITEM_CATEGORIES == ("电子", "小玩意", "衣物", "化妆品", "厨房")
    assert NOTE_CATEGORIES == ("生活小知识", "体态", "变美", "多伦多生活", "回国吃喝玩乐", "学习", "求职")
    assert INBOX_TYPES == ("活动", "备忘", "灵感", "链接", "清单", "待办")
    assert STAGES == ("想投", "已投递", "面试中", "Offer")


def test_food_kind_optional():
    f = parse_food_line("- [ ] 草莓 [数量:: 250 g] [到期:: 2026-11-22] [位置:: 冷藏] [类别:: 水果]")
    assert f.kind == "水果"
    assert format_food(f) == "- [ ] 草莓 [数量:: 250 g] [到期:: 2026-11-22] [位置:: 冷藏] [类别:: 水果]"
    assert parse_food_line("- [ ] 牛奶 [数量:: 1 L] [到期:: 2026-11-19] [位置:: 冷藏]").kind == ""


from lifeos_formats import Event, format_event, parse_event_line


def test_parse_event_timed():
    e = parse_event_line("- 2026-11-29 15:00 和朋友吃饭 [地点:: Bahen]")
    assert e.date == date(2026, 11, 29) and e.time == "15:00" and e.title == "和朋友吃饭" and e.place == "Bahen"


def test_parse_event_all_day():
    e = parse_event_line("- 2026-11-29 和朋友吃饭")
    assert e.time is None and e.place == "" and e.title == "和朋友吃饭"


def test_parse_event_rejects():
    for s in ("- 11-29 吃饭", "- 2026-11-29 25:00 吃饭", "- 2026-11-29"):
        assert parse_event_line(s) is None, s


def test_event_roundtrip_odd_text():
    line = format_event(Event(date(2026, 11, 29), None, "买 [礼物]\n给妈妈", ""))
    assert "\n" not in line
    assert parse_event_line(line).title == "买 [礼物] 给妈妈"
    s = "- 2026-11-29 15:00 和朋友吃饭 [地点:: Bahen]"
    assert format_event(parse_event_line(s)) == s


def test_parse_event_kind():
    e = parse_event_line("- 2026-11-29 15:00 小组讨论 [地点:: Bahen] [类别:: 学校]")
    assert e.title == "小组讨论" and e.place == "Bahen" and e.kind == "学校"
    e = parse_event_line("- 2026-11-29 读书会 [类别:: 社交]")
    assert e.place == "" and e.kind == "社交"
    s = "- 2026-11-29 15:00 小组讨论 [地点:: Bahen] [类别:: 学校]"
    assert format_event(parse_event_line(s)) == s
