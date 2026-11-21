"""网站（GitHub Pages）：只用示例数据，不带任何真实仓库里的笔记。"""
import json
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT / "tools"))

import build_site  # noqa: E402
import make_samples  # noqa: E402


def test_site_uses_sample_data_only(tmp_path):
    out = tmp_path / "site"
    build_site.build(out)
    vault = out / "vault"
    manifest = json.loads((vault / "manifest.json").read_text(encoding="utf-8"))
    assert "10 总部/首页.md" in manifest and "20 财务部/账本/2026-11.md" in manifest
    # 账本和示例生成器的输出一模一样（不是从真实仓库拷来的）
    ref = tmp_path / "ref"
    make_samples.main(ref)
    assert (vault / "20 财务部/账本/2026-11.md").read_text(encoding="utf-8") == (ref / "20 财务部/账本/2026-11.md").read_text(encoding="utf-8")
    # 每一篇笔记要么是 git 里跟踪的系统笔记，要么是示例生成器写的，要么是个人档案的空模板
    tracked = set(subprocess.run(["git", "ls-files", "LifeOS"], cwd=PROJECT, capture_output=True, text=True, check=True).stdout.split("\n"))
    samples = {p.relative_to(ref).as_posix() for p in ref.rglob("*.md")}
    for rel in manifest:
        ok = f"LifeOS/{rel}" in tracked or rel in samples or rel == "60 个人档案/个人档案.md"
        assert ok, rel
    # 系统文件（views、样式、插画）不复制，网站直接读仓库里的 LifeOS/90 系统
    assert not (vault / "90 系统").exists()
    profile = (vault / "60 个人档案/个人档案.md").read_text(encoding="utf-8")
    assert "lifeos-vault" not in profile  # 空模板，没有任何加密数据


def test_site_entry_page():
    html = (PROJECT / "tools/preview/index.html").read_text(encoding="utf-8")
    assert "LIFEOS_SITE" in html and "manifest.json" in html
    root = (PROJECT / "index.html").read_text(encoding="utf-8")
    assert "site/" in root
