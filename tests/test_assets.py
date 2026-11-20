import json
import re
import subprocess
from pathlib import Path

import build_fonts_css

PROJECT = Path(__file__).resolve().parent.parent
VAULT = PROJECT / "LifeOS"
MOCK = PROJECT / "demo/v4"
SNIPPETS = VAULT / ".obsidian/snippets"
FOOD_JS = VAULT / "90 系统/views/_shared/food.js"


def test_food_stickers_copied():
    copied = sorted(p.name for p in (VAULT / "90 系统/附件/food").glob("*.png"))
    assert len(copied) == 75
    assert copied == sorted(p.name for p in (MOCK / "assets/food").glob("*.png"))


def test_illustrations_copied():
    used = set()
    for f in list(MOCK.glob("*.html")) + list(MOCK.glob("*.js")):
        used |= set(re.findall(r"assets/([\w-]+\.png)", f.read_text(encoding="utf-8")))
    copied = {p.name for p in (VAULT / "90 系统/附件/插画").glob("*.png")}
    assert used and used <= copied


def test_css_has_tokens():
    css = (SNIPPETS / "lifeos.css").read_text(encoding="utf-8")
    for token in ["--green:#3e5b4b", "--paper:#ebf2ed", ".is-mobile", ".lifeos-dash", ".tape", ".stamp", ".ck", ".chip"]:
        assert token in css, token


def test_css_scoped_to_dashboards():
    # 只影响带 cssclasses: lifeos-dash 的笔记，不改 Obsidian 其余界面
    css = (SNIPPETS / "lifeos.css").read_text(encoding="utf-8")
    body = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    body = re.sub(r"@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}", "", body)
    body = re.sub(r"@(media|container)[^{]*\{", "", body)
    for selector_group in re.findall(r"([^{}@]+)\{", body):
        for sel in re.split(r",(?![^()]*\))", selector_group):
            sel = sel.strip()
            if sel and not sel.startswith(("from", "to", "0%", "100%")) and re.match(r"[\w.#:\[*]", sel):
                assert ".lifeos-dash" in sel, sel


def test_css_no_external_urls():
    for name in ["lifeos.css", "lifeos-fonts.css"]:
        css = (SNIPPETS / name).read_text(encoding="utf-8")
        # 唯一允许的 http 是内嵌 SVG 的命名空间声明，它不会发出网络请求
        assert "http" not in css.replace("http://www.w3.org/2000/svg", ""), name


def _node(script: str) -> str:
    return subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True).stdout


def test_food_icon_fallback():
    out = _node(f"""
const m = eval(require('fs').readFileSync({json.dumps(str(FOOD_JS))}, 'utf8'));
console.log(JSON.stringify([m.foodIcon('豆腐', 40), m.foodIcon('牛奶', 40), m.foodIcon('冻虾', 40), m.foodIcon('不认识', 40)]));
""")
    tofu, milk, shrimp, unknown = json.loads(out)
    assert "food-emoji" in tofu and "<img" not in tofu
    assert "<img" in milk and "90 系统/附件/food/牛奶.png" in milk
    assert "虾.png" in shrimp  # 冻虾 → 虾 的贴纸
    assert "food-emoji" in unknown


def test_food_js_sticker_list_matches_files():
    out = _node(f"""
const m = eval(require('fs').readFileSync({json.dumps(str(FOOD_JS))}, 'utf8'));
console.log(JSON.stringify([...m.FOOD_STICKERS]));
""")
    assert sorted(json.loads(out)) == sorted(p.stem for p in (VAULT / "90 系统/附件/food").glob("*.png"))


def test_build_fonts_css(tmp_path):
    fonts = tmp_path / "fonts"
    fonts.mkdir()
    (fonts / "Gaegu-Bold.woff2").write_bytes(b"\x00\x01fake")
    (fonts / "ZCOOLKuaiLe-Regular.woff2").write_bytes(b"\x00\x02fake")
    out = tmp_path / "lifeos-fonts.css"
    missing = build_fonts_css.build(fonts, out)
    css = out.read_text(encoding="utf-8")
    assert 'font-family:"Gaegu"' in css and "font-weight:700" in css
    assert 'font-family:"ZCOOL KuaiLe"' in css
    assert "data:font/woff2;base64,AAFmYWtl" in css
    assert "http" not in css
    assert set(missing) == {"DM Mono", "Playfair Display", "Crimson Text"}


def test_app_mode_snippet_only_touches_dashboards():
    # App 模式只在面板笔记上藏 Obsidian 界面，普通笔记不受影响
    css = (SNIPPETS / "lifeos-app.css").read_text(encoding="utf-8")
    body = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    rules = re.findall(r"([^{}]+)\{", body)
    assert rules
    for sel in rules:
        assert ":has(" in sel and ".lifeos-dash" in sel, sel
