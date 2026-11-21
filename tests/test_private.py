"""个人档案：模板里不能有任何数据；脚本只看文件大小、不读内容；页面不读任何文件。"""
import re
import subprocess
import sys
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
VIEWS = PROJECT / "LifeOS/90 系统/views"
sys.path.insert(0, str(PROJECT / "tools"))

import make_private  # noqa: E402


def test_private_templates_have_no_data():
    for name, text in make_private.TEMPLATES.items():
        rows = [l for l in text.splitlines() if l.startswith("|")]
        headers = {rows[i - 1] for i, l in enumerate(rows) if set(l) <= set("|- :")}  # 分隔行上面那行是表头
        for line in rows:
            if line not in headers and not set(line) <= set("|- :"):
                cells = [c.strip() for c in line.strip("|").split("|")]
                assert all(c == "" for c in cells[1:]), (name, line)  # 第一列是栏目名，其余一律空着
        body = text.split("```", 2)[-1]
        assert not re.search(r"\d", body), name  # 正文没有数字


def test_profile_view_reads_nothing():
    js = (VIEWS / "profile/view.js").read_text(encoding="utf-8")
    for bad in ("dv.pages(", "vault.read", "vault.process", "L.lines(", "L.cards("):
        assert bad not in js, bad
    loads = re.findall(r'dv\.io\.load\("([^"]+)"', js)
    assert loads and all(x.startswith("90 系统/views/_shared/") for x in loads), loads  # 只加载共用的 lib


def test_private_not_synced_doc():
    doc = (PROJECT / "LifeOS/90 系统/个人档案使用说明.md").read_text(encoding="utf-8")
    for word in ("AirDrop", "不上传", "Sync 排除", "Meld Encrypt"):
        assert word in doc, word


def test_make_private_only_fills_empty(tmp_path):
    folder = tmp_path / "60 个人档案"
    folder.mkdir()
    (folder / "个人档案.md").write_text("", encoding="utf-8")           # Obsidian 自动建的空白笔记
    (folder / "账号密码.md").write_text("我自己写的", encoding="utf-8")   # 已经有内容
    r = subprocess.run([sys.executable, str(PROJECT / "tools/make_private.py"), str(tmp_path)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert "身体数据" in (folder / "个人档案.md").read_text(encoding="utf-8")
    assert (folder / "账号密码.md").read_text(encoding="utf-8") == "我自己写的"   # 没被覆盖
    assert (folder / "账号密码（模板）.md").exists()
    assert "我自己写的" not in r.stdout + r.stderr                               # 不打印内容
