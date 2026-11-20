"""把 tools/fonts/ 里的 woff2 字体内嵌进 LifeOS/.obsidian/snippets/lifeos-fonts.css。

Obsidian（尤其 iPhone 上）不能从网上加载字体，所以字体直接 base64 写进 CSS。
字体文件请自己从 Google Fonts 下载放进 tools/fonts/（文件名里包含下面的关键词即可）。
中文正文用系统自带的 PingFang SC，不内嵌 Noto Sans SC（太大）。

用法：python3 tools/build_fonts_css.py
"""
from __future__ import annotations

import base64
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "tools/fonts"
OUT = ROOT / "LifeOS/.obsidian/snippets/lifeos-fonts.css"

# (CSS 字体名, 字重, 文件名关键词)
FACES = [
    ("ZCOOL KuaiLe", 400, "zcool"),
    ("Gaegu", 700, "gaegu"),
    ("DM Mono", 400, "dmmono"),
    ("Playfair Display", 700, "playfair"),
    ("Crimson Text", 600, "crimson"),
]


def _norm(name: str) -> str:
    return name.lower().replace("-", "").replace("_", "").replace(" ", "")


def build(fonts: Path = FONTS, out: Path = OUT) -> list[str]:
    """生成 CSS，返回还缺的字体名。"""
    files = sorted(fonts.glob("*.woff2")) if fonts.is_dir() else []
    parts = ["/* 由 tools/build_fonts_css.py 生成，不要手改。字体内嵌为 base64，不从网络加载。 */\n"]
    missing = []
    for family, weight, key in FACES:
        match = next((f for f in files if key in _norm(f.name)), None)
        if match is None:
            missing.append(family)
            continue
        data = base64.b64encode(match.read_bytes()).decode("ascii")
        parts.append(f'@font-face{{font-family:"{family}";font-weight:{weight};font-style:normal;font-display:swap;'
                     f'src:url(data:font/woff2;base64,{data}) format("woff2")}}\n')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(parts), encoding="utf-8")
    return missing


if __name__ == "__main__":
    missing = build()
    print(f"已写入 {OUT.relative_to(ROOT)}")
    if missing:
        print("还缺这些字体（从 Google Fonts 下载 woff2 放进 tools/fonts/ 后重跑）：" + "、".join(missing))
    sys.exit(0)
