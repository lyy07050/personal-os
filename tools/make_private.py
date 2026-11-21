"""建个人档案的空模板（只跑一次，由 Charlotte 自己在终端运行）。

只看文件大小、不读内容：
- 文件不在，或者是 0 字节（Obsidian 点链接时自动建的空白笔记）→ 写入模板
- 文件里已经有东西 → 不碰它，模板另存为「<名字>（模板）.md」

用法：python3 tools/make_private.py [仓库路径，默认 LifeOS]
"""
from __future__ import annotations

import sys
from pathlib import Path

FOLDER = "60 个人档案"

_HEAD = '''---
cssclasses:
  - lifeos-dash
  - lifeos-desk
---
```dataviewjs
await dv.view("90 系统/views/side", {{"page": "private"}})
await dv.view("90 系统/views/profile", {{"page": "{page}"}})
```
'''

TEMPLATES = {
    "个人档案.md": _HEAD.format(page="profile") + '''
## 身体数据

| 项目 | 记录 | 什么时候 |
|---|---|---|
| 体重 |  |  |
| 体检 |  |  |
| 生理期 |  |  |

## 尺码

| 项目 | 尺码 | 备注 |
|---|---|---|
| 衣服 |  |  |
| 裤子 |  |  |
| 鞋 |  |  |
| 戒指 |  |  |
''',
    "账号密码.md": _HEAD.format(page="accounts") + '''
## 账号密码

| 网站 / App | 账号 | 密码 | 备注 |
|---|---|---|---|
| 邮箱 |  |  |  |
| 学校 |  |  |  |
| 银行 |  |  |  |
| 其他 |  |  |  |
''',
}


def place(folder: Path, name: str, text: str) -> str:
    target = folder / name
    if not target.exists() or target.stat().st_size == 0:
        target.write_text(text, encoding="utf-8")
        return f"已建好：{FOLDER}/{name}"
    alt = folder / name.replace(".md", "（模板）.md")
    alt.write_text(text, encoding="utf-8")
    return f"{FOLDER}/{name} 里已经有内容，没有动它；模板另存为 {alt.name}"


def main(argv: list[str]) -> int:
    vault = Path(argv[1]) if len(argv) > 1 else Path(__file__).resolve().parent.parent / "LifeOS"
    if not vault.is_dir():
        print(f"找不到仓库：{vault}")
        return 1
    folder = vault / FOLDER
    folder.mkdir(exist_ok=True)
    for name, text in TEMPLATES.items():
        print(place(folder, name, text))
    print("下一步：照「90 系统/个人档案使用说明」填好内容，再用 Meld Encrypt 加密。")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
