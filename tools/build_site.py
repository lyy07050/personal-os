"""生成 GitHub Pages 用的网站 site/：能点的面板 + 示例数据。

不读真实仓库里的任何笔记：
- 数据：make_samples.py 现场生成（全是示例）
- 面板笔记（首页、各部门面板、手机页）：只拷 git 里跟踪的那几篇（本来就在 GitHub 上）
- views、样式、插画：不拷，网站直接读仓库里的 LifeOS/90 系统 和 LifeOS/.obsidian/snippets
- 个人档案：只放空模板（tools/make_private.py 里那份）

用法：python3 tools/build_site.py      然后 git add site && git commit && git push
本地看：python3 -m http.server 8766 --bind 127.0.0.1，打开 http://127.0.0.1:8766/site/
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT / "tools"))

import make_private  # noqa: E402
import make_samples  # noqa: E402

RIBBON = '''<div id="site-ribbon" style="position:fixed;left:12px;bottom:12px;z-index:100;max-width:calc(100vw - 24px);display:flex;gap:14px;align-items:center;
  background:#2f3a33;color:#e1ecd9;font:13px/1.4 'PingFang SC',sans-serif;padding:8px 16px;border-radius:999px;box-shadow:0 6px 20px rgba(37,45,41,.2)">
  <span>示例数据 · 可以随便加、改、删，只存在这个页面里，刷新就恢复</span>
  <a href="../demo/v4/index.html" style="color:#a9c39a">设计稿 →</a>
  <button onclick="this.parentElement.remove()" aria-label="关掉提示" style="background:none;border:0;color:#e1ecd9;cursor:pointer;font-size:14px">✕</button></div>
'''


def tracked(prefix: str = "LifeOS") -> list[str]:
    out = subprocess.run(["git", "ls-files", prefix], cwd=PROJECT, capture_output=True, text=True, check=True).stdout
    return [line for line in out.split("\n") if line]


def build(out: Path) -> Path:
    out = Path(out)
    vault = out / "vault"
    if vault.exists():
        shutil.rmtree(vault)  # 只删上一次生成的示例文件夹
    make_samples.main(vault)

    system_notes = []
    for rel in tracked():
        r = rel[len("LifeOS/"):]
        if not r.endswith(".md") or r.startswith("60 个人档案/"):
            continue
        if r.startswith("90 系统/"):
            system_notes.append(r)  # 模板、说明：网站直接读仓库里的
            continue
        dest = vault / r
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(PROJECT / rel, dest)

    profile = vault / "60 个人档案/个人档案.md"
    profile.parent.mkdir(parents=True, exist_ok=True)
    profile.write_text(make_private.TEMPLATES["个人档案.md"], encoding="utf-8")

    notes = sorted(p.relative_to(vault).as_posix() for p in vault.rglob("*.md"))
    (vault / "manifest.json").write_text(json.dumps(notes + sorted(system_notes), ensure_ascii=False, indent=0), encoding="utf-8")

    html = (PROJECT / "tools/preview/index.html").read_text(encoding="utf-8")
    html = html.replace("<title>LifeOS 面板预览</title>", "<title>my little os. · 示例</title>", 1)
    html = html.replace("<head>\n", '<head>\n<script>window.LIFEOS_SITE = { vault: "vault/", sys: "../LifeOS/" };</script>\n', 1)
    html = html.replace("<body>\n", "<body>\n" + RIBBON, 1)
    html = html.replace("</style>", "  #log{display:none!important} /* 网站上不显示写入日志 */\n</style>", 1)
    (out / "index.html").write_text(html, encoding="utf-8")
    return out


if __name__ == "__main__":
    dest = build(PROJECT / "site")
    n = len(json.loads((dest / "vault/manifest.json").read_text(encoding="utf-8")))
    print(f"网站已生成：{dest.relative_to(PROJECT)}（{n} 篇笔记，全是示例）")
