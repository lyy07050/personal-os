"""生成示例数据（内容和 HTML 稿 demo/v4 一致）。用法：python3 tools/make_samples.py LifeOS

- 「今天」默认是 2026-11-18（周三），和 HTML 稿一致；random.Random(7) 保证每次结果一样。
- 每个文件 frontmatter 带 `tags: [示例]`，方便以后一键删掉。
- 绝不往 `60 个人档案` 写内容（只建空文件夹）。
"""
from __future__ import annotations

import random
import sys
from datetime import date, datetime, timedelta
from decimal import Decimal
from pathlib import Path

from lifeos_formats import (Deadline, FoodItem, LedgerEntry, format_deadline, format_food,
                            format_ledger)

D = Decimal
TAG = "tags: [示例]"


def _w(root: Path, rel: str, body: str, meta: str = "") -> None:
    p = root / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    head = "---\n" + (meta.strip() + "\n" if meta.strip() else "") + TAG + "\n---\n"
    p.write_text(head + body.lstrip("\n"), encoding="utf-8")


# ---------- 财务 ----------

WEEK = [  # 本周 11.16–11.18，合计 214.50
    ("2026-11-18", "奶茶", "6.50", "餐饮", "ApplePay"),
    ("2026-11-18", "SQ *KOBO STORE", "14.99", "待分类", "ApplePay"),
    ("2026-11-18", "Pho 午饭", "16.85", "餐饮", "ApplePay"),
    ("2026-11-17", "Tim Hortons 早餐", "14.60", "餐饮", "ApplePay"),
    ("2026-11-17", "No Frills 超市", "42.86", "餐饮", "ApplePay"),
    ("2026-11-17", "Shoppers 纸巾", "27.00", "日用", "ApplePay"),
    ("2026-11-16", "AMZN Mktp CA", "23.40", "待分类", "信用卡"),
    ("2026-11-16", "Uniqlo 毛衣", "49.90", "服饰", "ApplePay"),
    ("2026-11-16", "Uber 回家", "18.40", "交通", "ApplePay"),
]
EARLIER_NOV = [
    ("2026-11-15", "Shoppers 洗面奶", "17.99", "美妆", "ApplePay"),
    ("2026-11-13", "Sephora 粉底", "62.01", "美妆", "信用卡"),
    ("2026-11-12", "T&T 超市", "38.75", "餐饮", "ApplePay"),
    ("2026-11-10", "Indigo 笔记本", "12.40", "学习", "ApplePay"),
    ("2026-11-08", "火锅聚餐", "46.20", "餐饮", "ApplePay"),
    ("2026-11-07", "Winners 围巾", "24.99", "服饰", "ApplePay"),
    ("2026-11-05", "Obsidian Sync", "5.00", "其他", "信用卡"),
    ("2026-11-04", "Cineplex 电影", "17.50", "娱乐", "ApplePay"),
    ("2026-11-03", "Spotify 学生", "6.49", "娱乐", "信用卡"),
    ("2026-11-03", "iCloud 50 GB", "1.29", "其他", "信用卡"),
    ("2026-11-02", "TTC 月票", "128.15", "交通", "ApplePay"),
]
MONTH_TOTAL = D("812.40")
OCT_NAMES = [("No Frills 超市", "餐饮"), ("奶茶", "餐饮"), ("Pho 午饭", "餐饮"), ("TTC", "交通"),
             ("Shoppers", "日用"), ("Uniqlo", "服饰"), ("Indigo", "学习"), ("Cineplex", "娱乐"),
             ("Dollarama", "日用"), ("Sephora", "美妆")]


def _ledger(rows) -> list[LedgerEntry]:
    return [LedgerEntry(date.fromisoformat(d), n, D(a), c, m) for d, n, a, c, m in rows]


def make_finance(root: Path, rng: random.Random) -> None:
    nov = _ledger(WEEK + EARLIER_NOV)
    rest = MONTH_TOTAL - sum(e.amount for e in nov)  # 用一笔 Costco 补齐到本月总数
    nov.append(LedgerEntry(date(2026, 11, 14), "Costco 采购", rest, "餐饮", "信用卡"))
    nov.sort(key=lambda e: e.date, reverse=True)
    _w(root, "20 财务部/账本/2026-11.md", "# 2026 年 11 月\n\n" + "\n".join(map(format_ledger, nov)) + "\n",
       "month: 2026-11\nbudget: 1400")
    octo = []
    for day in range(31, 0, -1):
        for _ in range(rng.choice([0, 1, 1, 2])):
            name, cat = rng.choice(OCT_NAMES)
            octo.append(LedgerEntry(date(2026, 10, day), name, D(rng.randint(300, 6000)) / 100, cat, "ApplePay"))
    _w(root, "20 财务部/账本/2026-10.md", "# 2026 年 10 月\n\n" + "\n".join(map(format_ledger, octo)) + "\n",
       "month: 2026-10\nbudget: 1400")
    _w(root, "20 财务部/分类规则.md", """# 分类规则

商户名里包含左边的词，就记成右边的分类。认不出的记「待分类」。

- No Frills → 餐饮
- T&T → 餐饮
- Costco → 餐饮
- Tim Hortons → 餐饮
- TTC → 交通
- Uber → 交通
- Uniqlo → 服饰
- Winners → 服饰
- Shoppers → 日用
- Sephora → 美妆
- Indigo → 学习
- Cineplex → 娱乐
- Spotify → 娱乐
""")
    _w(root, "20 财务部/订阅.md", """# 订阅

- Spotify 学生 [金额:: 6.49] [周期:: 月] [扣款日:: 3]
- iCloud 50 GB [金额:: 1.29] [周期:: 月] [扣款日:: 3]
- Obsidian Sync [金额:: 5.00] [周期:: 月] [扣款日:: 5]
""")


# ---------- 后勤 ----------

FOOD = [
    ("牛奶", "1 L", "2026-11-19", "冷藏", "生鲜"), ("鸡蛋", "6 个", "2026-11-21", "冷藏", "生鲜"),
    ("草莓", "250 g", "2026-11-22", "冷藏", "水果"), ("小葱", "1 把", "2026-11-23", "冷藏", "生鲜"),
    ("酸奶", "2 杯", "2026-11-24", "冷藏", "零食"), ("嫩豆腐", "1 盒", "2026-11-26", "冷藏", "生鲜"),
    ("饺子", "半袋", "2026-12-02", "冷冻", "粉面速食"), ("冻虾", "300 g", "2026-12-09", "冷冻", "生鲜"),
    ("汤圆", "1 袋", "2026-12-18", "冷冻", "粉面速食"),
    ("意面", "2 包", "无", "常温", "粉面速食"), ("大米", "3 kg", "无", "常温", "粉面速食"),
    ("生抽", "半瓶", "无", "常温", "调味料"), ("燕麦", "1 袋", "2026-12-09", "常温", "粉面速食"),
    ("蜂蜜", "1 罐", "无", "常温", "调味料"), ("泡面", "4 包", "无", "常温", "粉面速食"),
]
THINGS = [
    ("降噪耳机", "电子", "书桌抽屉", "2026-11-02", 249, "2027-11-02", ""),
    ("Kindle", "电子", "床头", "2024-12-25", 139, "2025-12-25", ""),
    ("驼色大衣", "衣物", "衣柜左边", "2025-10-20", 189, "", "尺码 S"),
    ("雪地靴", "衣物", "门口鞋柜", "2025-11-30", 120, "", "尺码 37"),
    ("电饭煲", "厨房", "厨房台面", "2025-09-03", 69, "2026-12-03", ""),
    ("手冲壶", "厨房", "厨房上柜", "2026-03-14", 45, "", "滤纸在旁边"),
    ("防晒霜", "化妆品", "浴室镜柜", "2026-05-02", 28, "", "开封 2026.06 · 12 月要换"),
    ("香薰蜡烛", "小玩意", "床头柜", "2026-10-11", 22, "", "还剩一半"),
    ("拍立得相纸", "小玩意", "书桌第二个抽屉", "2026-08-20", 19, "", "剩余 7 张"),
]
RECIPES = [
    ("牛奶燕麦杯", "牛奶, 燕麦, 草莓", "牛奶 200 ml + 燕麦 + 草莓切丁，前一晚放冷藏。"),
    ("葱花炒蛋", "鸡蛋, 小葱", "3 个鸡蛋打散加盐，小葱切花，中火 2 分钟。"),
    ("葱油拌豆腐", "嫩豆腐, 小葱", "豆腐切块，淋热油葱花和生抽，5 分钟。"),
]


def make_logistics(root: Path) -> None:
    lines = []
    for place in ("冷藏", "冷冻", "常温"):
        lines.append(f"\n## {place}\n")
        for n, q, exp, p, k in FOOD:
            if p == place:
                lines.append(format_food(FoodItem(False, n, q, None if exp == "无" else date.fromisoformat(exp), p, k)))
    _w(root, "30 后勤部/食物.md", "# 食物\n" + "\n".join(lines) + "\n")
    _w(root, "30 后勤部/购物清单.md",
       "# 购物清单\n\n- [ ] 鸡蛋 12 个\n- [ ] 菠菜\n- [x] 牛奶 2 L\n- [ ] 鸡腿肉\n- [ ] 燕麦\n")
    for name, ingr, steps in RECIPES:
        _w(root, f"30 后勤部/食谱/{name}.md", f"# {name}\n\n{steps}\n", f"ingredients: [{ingr}]\nminutes: 5")
    for name, cat, loc, bought, price, warranty, note in THINGS:
        _w(root, f"30 后勤部/物品/{name}.md", f"# {name}\n",
           f"category: {cat}\nlocation: {loc}\nbought: {bought}\nprice: {price}\nwarranty: {warranty}\nnote: {note}")


# ---------- 研发 ----------

NOTES = [
    ("一周备餐：5 天午饭", "生活小知识", "小红书", "2026-11-17", "周日做两种主菜 + 一种蔬菜，分 5 盒冷藏，第 4、5 天的放冷冻。"),
    ("pandas 的 groupby", "学习", "课堂", "2026-11-16", "df.groupby('类别')['金额'].sum() —— 按类别求和，用在账本分析上正合适。"),
    ("面试 STAR 法则", "求职", "网页", "2026-11-15", "情境 Situation、任务 Task、行动 Action、结果 Result，每个故事控制在 2 分钟。"),
    ("番茄钟", "学习", "抖音", "2026-11-14", "专注 25 分钟，休息 5 分钟；做满 4 轮之后休息 15 – 30 分钟。"),
    ("加拿大报税 T2202", "多伦多生活", "网页", "2026-11-12", "学费抵税表在 ACORN 下载，二月底前出，报税时填进去。"),
    ("冬天护手", "变美", "小红书", "2026-11-10", "洗手后 1 分钟内涂护手霜，晚上厚涂 + 戴棉手套。"),
]
WORDS = [("procrastinate", "v. 拖延 · I tend to procrastinate on Mondays."), ("stakeholder", "n. 利益相关方"),
         ("regression", "n. 回归（统计）"), ("meticulous", "adj. 一丝不苟的"), ("leverage", "v. 利用、借助"),
         ("tentative", "adj. 暂定的"), ("alleviate", "v. 减轻"), ("scrutinize", "v. 仔细检查")]
MISTAKES = ["meticulous", "tentative", "alleviate", "scrutinize"]


def make_research(root: Path) -> None:
    for title, cat, src, created, body in NOTES:
        _w(root, f"40 研发部/知识卡/{title}.md", f"# {title}\n\n{body}\n",
           f"category: {cat}\nsource: {src}\ncreated: {created}")
    _w(root, "40 研发部/灵感/把日子过成一张地图.md", "收集喜欢的咖啡馆、散步路线，还有那些安静的小角落。\n", "created: 2026-11-15")
    _w(root, "40 研发部/灵感/想试试的一件小事.md", "给每周留一个不赶时间的晚上。做顿饭、散散步，或者什么都不做。\n", "created: 2026-11-12")
    _w(root, "40 研发部/胡思乱想/2026-11-16.md", "如果每个月只能买一样新东西，我会买什么？\n", "date: 2026-11-16")
    _w(root, "40 研发部/胡思乱想/2026-11-09.md", "下雪的第一天，路上的人都走得很慢。\n", "date: 2026-11-09")
    vocab = {w: m for w, m in WORDS}
    _w(root, "40 研发部/英语/单词本.md", "#flashcards\n\n" + "\n".join(f"{w}::{m}" for w, m in WORDS) + "\n")
    _w(root, "40 研发部/英语/错词本.md", "#flashcards\n\n" + "\n".join(f"{w}::{vocab[w]}" for w in MISTAKES) + "\n")


# ---------- 教务 ----------

COURSES = [
    ("INF 1340", "Programming for Data Science", "周四 10:00"),
    ("DATA 101", "Intro to Data Analytics", "周一 14:00"),
    ("INF 1343", "Data Modeling & Database", "周二 18:00"),
    ("INF 2178", "Experimental Design", "周三 13:00"),
]
DEADLINES = [
    Deadline(True, "INF 1340 Assignment 2", datetime(2026, 11, 11, 23, 59), "INF 1340"),
    Deadline(False, "DATA 101 作业 4", datetime(2026, 11, 18, 23, 59), "DATA 101"),
    Deadline(False, "INF 1340 Assignment 3", datetime(2026, 11, 25, 23, 59), "INF 1340"),
    Deadline(False, "INF 1343 项目提案", datetime(2026, 11, 27, 18, 0), "INF 1343"),
    Deadline(False, "INF 2178 期中考试", datetime(2026, 11, 30, 23, 59), "INF 2178"),
]


def make_school(root: Path) -> None:
    body = "# 截止日期\n\n<!-- quercus:start -->\n" + "\n".join(map(format_deadline, DEADLINES)) + "\n<!-- quercus:end -->\n"
    _w(root, "45 教务处/截止日期.md", body)
    for code, name, nxt in COURSES:
        mine = [format_deadline(d) for d in DEADLINES if d.course == code]
        _w(root, f"45 教务处/课程/{code} {name}/课程主页.md",
           f"# {code} {name}\n\n下次课：{nxt}\n\n<!-- quercus:start -->\n" + "\n".join(mine) + "\n<!-- quercus:end -->\n\n## 我的笔记\n",
           f"course: {code}\nnext_class: {nxt}")
    (root / "45 教务处/课件").mkdir(parents=True, exist_ok=True)


# ---------- 人事 ----------

JOBS = [  # (公司, 职位, stage, 日期说明)
    ("Shopify", "Data Analyst Intern", "想投", "截止 2026-11-30"), ("RBC", "Business Insights Co-op", "想投", "截止 2026-12-05"),
    ("Scotiabank", "Data Analyst Co-op", "想投", ""), ("Telus", "BI Intern", "想投", ""), ("Rogers", "Analytics Intern", "想投", ""),
    ("TD Bank", "Data Science Intern", "已投递", "2026-11-10"), ("Wealthsimple", "Analytics Intern", "已投递", "2026-11-06"),
    ("Loblaw Digital", "Product Analyst Co-op", "已投递", "2026-11-02"), ("BMO", "Data Analyst Intern", "已投递", "2026-10-30"),
    ("Sun Life", "Analytics Co-op", "已投递", "2026-10-28"), ("Bell", "Data Intern", "已投递", "2026-10-25"),
    ("Deloitte", "Analytics Intern", "已投递", "2026-10-20"),
    ("Manulife", "Data Analyst Intern", "面试中", "周五 15:00 二面"), ("CIBC", "Risk Analytics Co-op", "面试中", "等结果"),
]


def make_career(root: Path) -> None:
    for company, role, stage, when in JOBS:
        _w(root, f"50 人事部/投递/{company} {role}.md", f"# {company} · {role}\n",
           f"company: {company}\nrole: {role}\nstage: {stage}\nwhen: {when}")
    _w(root, "50 人事部/面试/Manulife 二面.md", """# 周五面试准备 · Manulife 二面 · 视频

- [ ] 复习简历上的 3 个项目
- [ ] 准备 2 个 STAR 故事（团队冲突、赶截止）
- [ ] SQL 窗口函数再练 5 题
- [ ] 想好 3 个反问问题
""", "company: Manulife\ndate: 2026-11-20 15:00")


# ---------- 总部 ----------

PROJECTS = [("DATA 101 作业 4", 60), ("投 2 份实习", 50), ("整理本周账单", 25), ("背 20 个单词", 60), ("买鸡蛋和牛奶", 0)]
INBOX = [  # (文件名, type, pinned, source, date, 正文)
    ("回国准备", "备忘", "true", "", "", "# 回🇨🇳准备\n\n- [x] 爸爸要的鱼油 ×2\n- [x] 枫糖浆\n- [x] 冰酒\n- [ ] 西洋参\n- [ ] 护手霜 ×3\n- [ ] 给外婆的围巾\n- [ ] 充电宝\n"),
    ("回加准备", "备忘", "true", "", "", "# 回🇨🇦准备\n\n- [ ] 续签学签材料\n- [ ] 带一包火锅底料\n- [ ] 冬天的厚袜子\n- [ ] 常用药\n"),
    ("周末慢一点", "清单", "false", "", "", "# 周末，慢一点\n\n- [x] 整理一下桌面\n- [ ] 把照片备份一下\n- [ ] 给绿植浇水\n\n#生活杂事\n"),
    ("下次逛超市", "清单", "false", "", "", "# 下次逛超市\n\n路过的时候，顺手看看。\n\n- [ ] 燕麦\n- [ ] 酸奶\n- [ ] 香蕉\n- [ ] 鸡蛋\n- [ ] 厨房纸\n\n#日常补货\n"),
    ("把日子过成一张地图", "灵感", "false", "", "", "# 把日子过成一张地图\n\n收集喜欢的咖啡馆、散步路线，还有那些安静的小角落。\n\n#想去的地方\n"),
    ("想试试的一件小事", "灵感", "false", "", "", "# 想试试的一件小事\n\n给每周留一个不赶时间的晚上。做顿饭、散散步，或者什么都不做。\n\n#生活灵感\n"),
    ("读书笔记模板", "灵感", "false", "", "", "# 读书笔记模板\n\n书名、金句、我的想法。\n"),
    ("周复盘模板", "链接", "false", "网页", "", "# 资料和链接，先收好\n\nhttps://notion.so · 周复盘模板 · 看到第 3 节\n\n#待阅读\n"),
    ("Networking event", "活动", "false", "邮件", "2026-11-21", "# Networking event\n\nBahen 1F · 18:00 带两份简历。\n"),
    ("圣诞老人游行", "活动", "false", "小红书", "2026-11-29", "# 圣诞老人游行\n\n市中心 · 下午开始，早点去占位置。\n"),
    ("crafting activity", "活动", "false", "小红书", "2026-12-06", "# crafting activity\n\n需要报名 · 名额有限。\n"),
]


def make_hq(root: Path, today: date, rng: random.Random) -> None:
    for title, progress in PROJECTS:
        _w(root, f"10 总部/项目/{title}.md", f"# {title}\n", f"progress: {progress}\nstatus: {'未开始' if progress == 0 else '进行中'}")
    for name, typ, pinned, src, day, body in INBOX:
        meta = f"type: {typ}\npinned: {pinned}\nsource: {src}" + (f"\ndate: {day}" if day else "")
        _w(root, f"00 随手记/{name}.md", body, meta)
    for i in range(112):  # 最近 112 天日记；背词连续 23 天
        d = today - timedelta(days=i)
        habits = {"早起": rng.random() < 0.6, "喝水": rng.random() < 0.75, "运动": rng.random() < 0.4,
                  "背词": i < 23 or (i > 23 and rng.random() < 0.7), "早睡": rng.random() < 0.5}
        meta = f"date: {d.isoformat()}\n" + "\n".join(f"{k}: {'true' if v else 'false'}" for k, v in habits.items())
        _w(root, f"10 总部/日记/{d.isoformat()}.md", f"# {d.month} 月 {d.day} 日\n", meta)


def main(root: Path, today: date = date(2026, 11, 18)) -> None:
    root = Path(root)
    rng = random.Random(7)
    make_finance(root, rng)
    make_logistics(root)
    make_research(root)
    make_school(root)
    make_career(root)
    make_hq(root, today, rng)
    (root / "60 个人档案").mkdir(parents=True, exist_ok=True)  # 只建空文件夹，不写任何内容


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else Path("LifeOS"))
